-- =============================================================================
-- MIGRATION: 003_improve_update_trigger.sql
-- Mejora del Trigger UPDATE para fact_reservas
--
-- PROBLEMA SOLUCIONADO:
-- Antes: Si usuario editaba solo monto_anticipo_usd sin cambiar precio_total,
--        el trigger no recalculaba (precio_total no cambió).
--        Resultado: Se rompía el 30/70 split.
--
-- SOLUCIÓN:
-- 1. Detectar si se intenta editar directamente monto_anticipo_usd o monto_saldo_usd
-- 2. Si detecta cambio en esos montos, recalcular desde precio_total (fuente de verdad)
-- 3. Asegurar que SIEMPRE se respeta el 30/70 split
-- 4. Recalcular ARS si cambiaron montos base USD o TC
-- =============================================================================

DELIMITER $$

DROP TRIGGER IF EXISTS trg_reservas_before_update_completo$$

CREATE TRIGGER trg_reservas_before_update_completo
BEFORE UPDATE ON fact_reservas
FOR EACH ROW
BEGIN
    DECLARE v_comision_pct   DECIMAL(5, 2) DEFAULT 0.00;
    DECLARE v_noches         INT;
    DECLARE v_recalc_usd     TINYINT DEFAULT 0; -- flag: ¿hay que recalcular cadena USD?
    DECLARE v_recalc_ars     TINYINT DEFAULT 0; -- flag: ¿hay que recalcular ARS?

    -- =========================================================================
    -- BLOQUE 1: FECHAS
    -- Si cambia alguna fecha, recalcular noches y activar flag de recálculo USD.
    -- =========================================================================
    IF NEW.fecha_checkin_fk <> OLD.fecha_checkin_fk
       OR NEW.fecha_checkout_fk <> OLD.fecha_checkout_fk THEN

        SET v_noches = DATEDIFF(NEW.fecha_checkout_fk, NEW.fecha_checkin_fk);

        IF v_noches <= 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: La fecha de Check-out debe ser posterior a la de Check-in.';
        END IF;

        SET NEW.noches_estadia = v_noches;
        SET v_recalc_usd = 1;

    ELSE
        -- Fechas no cambiaron: usar las noches que ya estaban en la fila
        SET v_noches = OLD.noches_estadia;
    END IF;

    -- =========================================================================
    -- BLOQUE 2: PRECIO TOTAL
    -- Si cambia el precio, activar flag de recálculo USD.
    -- =========================================================================
    IF NEW.precio_total_cotizado_usd <> OLD.precio_total_cotizado_usd THEN

        IF NEW.precio_total_cotizado_usd IS NULL OR NEW.precio_total_cotizado_usd <= 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Se debe proveer un precio_total_cotizado_usd válido.';
        END IF;

        SET v_recalc_usd = 1;
    END IF;

    -- =========================================================================
    -- BLOQUE 2B: DETECCIÓN DE EDICIÓN DIRECTA DE MONTOS (NUEVO - SOLUCIONA PROBLEMA B)
    -- Si alguien intenta editar monto_anticipo_usd o monto_saldo_usd directamente,
    -- detectamos el intento y activamos recálculo desde precio_total.
    -- Esto PREVIENE que se rompa el split 30/70.
    -- =========================================================================
    IF NEW.monto_anticipo_usd <> OLD.monto_anticipo_usd
       OR NEW.monto_saldo_usd <> OLD.monto_saldo_usd THEN
        -- Usuario intentó editar anticipo/saldo directamente
        -- Recalcular desde precio_total (que es la fuente de verdad)
        -- Esto sobrescribe el intento de edición manual
        SET v_recalc_usd = 1;
        SET v_recalc_ars = 1; -- También recalcular ARS porque base USD cambiará
    END IF;

    -- =========================================================================
    -- BLOQUE 3: RECÁLCULO COMPLETO EN USD
    -- Se ejecuta si cambió el precio, las fechas, los montos, o el canal.
    -- SIEMPRE en este orden: precio/noche → anticipo → saldo → comisión.
    -- =========================================================================
    IF v_recalc_usd = 1
       OR NEW.id_canal_fk <> OLD.id_canal_fk THEN

        SET NEW.precio_noche_cotizado_usd = ROUND(NEW.precio_total_cotizado_usd / v_noches, 2);
        SET NEW.monto_anticipo_usd        = ROUND(NEW.precio_total_cotizado_usd * 0.30, 2);
        SET NEW.monto_saldo_usd           = ROUND(NEW.precio_total_cotizado_usd * 0.70, 2);

        SELECT COALESCE(costo_asociado_pct, 0.00)
        INTO   v_comision_pct
        FROM   dim_canales
        WHERE  id_canal = NEW.id_canal_fk;

        SET NEW.comision_canal_usd = ROUND(NEW.precio_total_cotizado_usd * (v_comision_pct / 100.00), 2);

        -- Marcar que ARS necesita recalcularse porque base USD cambió
        SET v_recalc_ars = 1;

    END IF;

    -- =========================================================================
    -- BLOQUE 4: RECÁLCULO ARS (MEJORADO)
    -- Usa NEW.monto_anticipo_usd y NEW.monto_saldo_usd que ya son los correctos
    -- (fueron actualizados en el bloque 3 si correspondía).
    --
    -- Condición: recalcular ARS si:
    --   1. Cambió el TC (tipo_cambio_anticipo o tipo_cambio_saldo)
    --   2. La base USD cambió (v_recalc_ars = 1 o precio_total cambió)
    --   3. Era primera vez (OLD.tipo_cambio_* era NULL)
    -- =========================================================================

    -- Anticipo ARS
    IF NEW.tipo_cambio_anticipo IS NOT NULL AND NEW.tipo_cambio_anticipo > 0
       AND (
           OLD.tipo_cambio_anticipo IS NULL
           OR NEW.tipo_cambio_anticipo <> OLD.tipo_cambio_anticipo
           OR v_recalc_ars = 1
           OR v_recalc_usd = 1
       ) THEN
        SET NEW.pago_anticipo_ars = ROUND(NEW.tipo_cambio_anticipo * NEW.monto_anticipo_usd, 2);
    END IF;

    -- Saldo ARS
    IF NEW.tipo_cambio_saldo IS NOT NULL AND NEW.tipo_cambio_saldo > 0
       AND (
           OLD.tipo_cambio_saldo IS NULL
           OR NEW.tipo_cambio_saldo <> OLD.tipo_cambio_saldo
           OR v_recalc_ars = 1
           OR v_recalc_usd = 1
       ) THEN
        SET NEW.pago_saldo_ars = ROUND(NEW.tipo_cambio_saldo * NEW.monto_saldo_usd, 2);
    END IF;

END$$

DELIMITER ;

-- =============================================================================
-- COMENTARIO FINAL:
-- Este trigger ahora maneja:
-- ✅ Cambios en precio_total → recalcula 30/70 split
-- ✅ Cambios en fechas → recalcula noches y precio/noche
-- ✅ Cambios en canal → recalcula comisión
-- ✅ NUEVO: Intento de editar montos directamente → recalcula desde precio_total
-- ✅ NUEVO: Recalcula ARS cuando montos USD cambian
-- ✅ Recalcula ARS cuando tipo de cambio cambia
-- =============================================================================
