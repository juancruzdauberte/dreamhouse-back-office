-- =============================================================================
-- MIGRATION: 005_flexible_update_trigger.sql
-- Trigger UPDATE mejorado que funciona con USD O ARS
-- =============================================================================

DELIMITER $$

DROP TRIGGER IF EXISTS trg_reservas_before_update_completo$$

CREATE TRIGGER trg_reservas_before_update_completo
BEFORE UPDATE ON fact_reservas
FOR EACH ROW
BEGIN
    DECLARE v_comision_pct   DECIMAL(5, 2) DEFAULT 0.00;
    DECLARE v_noches         INT;
    DECLARE v_recalc_usd     TINYINT DEFAULT 0;
    DECLARE v_recalc_ars     TINYINT DEFAULT 0;
    DECLARE v_monto_anticipo DECIMAL(10, 2);
    DECLARE v_monto_saldo    DECIMAL(10, 2);

    -- =========================================================================
    -- BLOQUE 1: FECHAS
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
        SET v_noches = OLD.noches_estadia;
    END IF;

    -- =========================================================================
    -- BLOQUE 2: PRECIO TOTAL (USD o ARS)
    -- =========================================================================
    IF NEW.precio_total_cotizado_usd <> OLD.precio_total_cotizado_usd
       OR NEW.precio_total_cotizado_ars <> OLD.precio_total_cotizado_ars THEN

        -- Validar que al menos uno sea válido
        IF (NEW.precio_total_cotizado_usd IS NULL OR NEW.precio_total_cotizado_usd <= 0)
           AND (NEW.precio_total_cotizado_ars IS NULL OR NEW.precio_total_cotizado_ars <= 0) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: Se debe proveer precio_total_cotizado_usd O precio_total_cotizado_ars válido.';
        END IF;

        SET v_recalc_usd = 1;
    END IF;

    -- =========================================================================
    -- BLOQUE 2B: DETECCIÓN DE EDICIÓN DIRECTA DE MONTOS
    -- =========================================================================
    IF NEW.monto_anticipo_usd <> OLD.monto_anticipo_usd
       OR NEW.monto_saldo_usd <> OLD.monto_saldo_usd THEN
        SET v_recalc_usd = 1;
        SET v_recalc_ars = 1;
    END IF;

    -- =========================================================================
    -- BLOQUE 3: RECÁLCULO COMPLETO EN USD/ARS
    -- =========================================================================
    IF v_recalc_usd = 1
       OR NEW.id_canal_fk <> OLD.id_canal_fk THEN

        -- Calcular basándose en USD si está disponible, sino en ARS
        IF NEW.precio_total_cotizado_usd IS NOT NULL AND NEW.precio_total_cotizado_usd > 0 THEN
            SET NEW.precio_noche_cotizado_usd = ROUND(NEW.precio_total_cotizado_usd / v_noches, 2);
            SET v_monto_anticipo               = ROUND(NEW.precio_total_cotizado_usd * 0.30, 2);
            SET v_monto_saldo                  = ROUND(NEW.precio_total_cotizado_usd * 0.70, 2);
        ELSE
            -- Solo ARS disponible
            SET NEW.precio_noche_cotizado_usd = ROUND(NEW.precio_total_cotizado_ars / v_noches, 2);
            SET v_monto_anticipo               = ROUND(NEW.precio_total_cotizado_ars * 0.30, 2);
            SET v_monto_saldo                  = ROUND(NEW.precio_total_cotizado_ars * 0.70, 2);
        END IF;

        SET NEW.monto_anticipo_usd = v_monto_anticipo;
        SET NEW.monto_saldo_usd    = v_monto_saldo;

        -- Comisión
        SELECT COALESCE(costo_asociado_pct, 0.00)
        INTO   v_comision_pct
        FROM   dim_canales
        WHERE  id_canal = NEW.id_canal_fk;

        -- Base para comisión depende de qué precio se use
        IF NEW.precio_total_cotizado_usd IS NOT NULL AND NEW.precio_total_cotizado_usd > 0 THEN
            SET NEW.comision_canal_usd = ROUND(NEW.precio_total_cotizado_usd * (v_comision_pct / 100.00), 2);
        ELSE
            SET NEW.comision_canal_usd = ROUND(NEW.precio_total_cotizado_ars * (v_comision_pct / 100.00), 2);
        END IF;

        SET v_recalc_ars = 1;
    END IF;

    -- =========================================================================
    -- BLOQUE 4: RECÁLCULO ARS
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
