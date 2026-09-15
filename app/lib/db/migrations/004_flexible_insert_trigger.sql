-- =============================================================================
-- TRIGGER: trg_reservas_before_insert_completo
-- Evento:  BEFORE INSERT en fact_reservas
-- Función: Calcula y valida todos los campos derivados al crear una reserva.
--          El operador solo provee las fechas, precio total y canal.
-- =============================================================================
DELIMITER $$

DROP TRIGGER IF EXISTS trg_reservas_before_insert_completo$$

CREATE TRIGGER trg_reservas_before_insert_completo
BEFORE INSERT ON fact_reservas
FOR EACH ROW
BEGIN
    DECLARE v_comision_pct DECIMAL(5, 2) DEFAULT 0.00;
    DECLARE v_noches       INT;
    DECLARE v_monto_anticipo DECIMAL(10, 2);
    DECLARE v_monto_saldo    DECIMAL(10, 2);

    -- 1. Calcular noches de estadía
    SET v_noches = DATEDIFF(NEW.fecha_checkout_fk, NEW.fecha_checkin_fk);
    SET NEW.noches_estadia = v_noches;

    -- 2. Validar coherencia de fechas
    IF v_noches <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: La fecha de Check-out debe ser posterior a la de Check-in.';
    END IF;

    -- 3. Validar que AL MENOS uno de los precios sea válido (USD o ARS)
    IF (NEW.precio_total_cotizado_usd IS NULL OR NEW.precio_total_cotizado_usd <= 0)
       AND (NEW.precio_total_cotizado_ars IS NULL OR NEW.precio_total_cotizado_ars <= 0) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: Se debe proveer precio_total_cotizado_usd O precio_total_cotizado_ars válido.';
    END IF;

    -- 4. Precio por noche (basado en USD si está disponible, sino en ARS)
    IF NEW.precio_total_cotizado_usd IS NOT NULL AND NEW.precio_total_cotizado_usd > 0 THEN
        SET NEW.precio_noche_cotizado_usd = NEW.precio_total_cotizado_usd / v_noches;
        
        -- 5. Anticipo 30% / Saldo 70% (basado en USD)
        SET v_monto_anticipo       = ROUND(NEW.precio_total_cotizado_usd * 0.30, 2);
        SET v_monto_saldo          = ROUND(NEW.precio_total_cotizado_usd * 0.70, 2);
        SET NEW.monto_anticipo_usd = v_monto_anticipo;
        SET NEW.monto_saldo_usd    = v_monto_saldo;
        
        -- 6. Comisión del canal (basada en USD)
        SELECT COALESCE(costo_asociado_pct, 0.00)
        INTO   v_comision_pct
        FROM   dim_canales
        WHERE  id_canal = NEW.id_canal_fk;

        SET NEW.comision_canal_usd = ROUND(NEW.precio_total_cotizado_usd * (v_comision_pct / 100.00), 2);
    ELSE
        -- Si solo hay ARS, calcular desde ARS (usar un tipo de cambio dummy de 1.0)
        SET NEW.precio_noche_cotizado_usd = NEW.precio_total_cotizado_ars / v_noches;
        SET v_monto_anticipo       = ROUND(NEW.precio_total_cotizado_ars * 0.30, 2);
        SET v_monto_saldo          = ROUND(NEW.precio_total_cotizado_ars * 0.70, 2);
        SET NEW.monto_anticipo_usd = v_monto_anticipo;
        SET NEW.monto_saldo_usd    = v_monto_saldo;
        
        SELECT COALESCE(costo_asociado_pct, 0.00)
        INTO   v_comision_pct
        FROM   dim_canales
        WHERE  id_canal = NEW.id_canal_fk;

        SET NEW.comision_canal_usd = ROUND(NEW.precio_total_cotizado_ars * (v_comision_pct / 100.00), 2);
    END IF;

    -- 7. Pagos en ARS (solo si se proveyó tipo de cambio)
    IF NEW.tipo_cambio_anticipo IS NOT NULL AND NEW.tipo_cambio_anticipo > 0 THEN
        SET NEW.pago_anticipo_ars = ROUND(NEW.tipo_cambio_anticipo * v_monto_anticipo, 2);
    END IF;

    IF NEW.tipo_cambio_saldo IS NOT NULL AND NEW.tipo_cambio_saldo > 0 THEN
        SET NEW.pago_saldo_ars = ROUND(NEW.tipo_cambio_saldo * v_monto_saldo, 2);
    END IF;

END$$

DELIMITER ;
