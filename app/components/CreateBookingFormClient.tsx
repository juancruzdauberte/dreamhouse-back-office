"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Calendar,
  MessageSquare,
  Tag,
  User,
  Home,
} from "lucide-react";
import { createBooking } from "../lib/actions/booking.actions";
import { FormField } from "./FormField";
import { PriceInput } from "./PriceInput";
import { ReusableForm } from "./ReusableForm";
import { BookingFormSection } from "./BookingFormSection";
import { CHANNELS } from "../lib/constants/channels";
import type { PropertyDTO } from "../lib/repository/property/property.dto";

type BookingFormClientProps = {
  datesUnavailable: Array<{
    check_in: string | Date;
    check_out: string | Date;
  }>;
  properties: PropertyDTO[];
};

export function CreateBookingFormClient({
  datesUnavailable,
  properties,
}: BookingFormClientProps) {
  const router = useRouter();

  const [selectedProperty, setSelectedProperty] = useState<number>(0);
  const [currency, setCurrency] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number>(0);

  const maxGuests = useMemo(
    () => properties.find((p) => p.id === selectedProperty)?.max_guests || 0,
    [selectedProperty, properties],
  );

  // Track the current price for live preview calculation
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // Custom deposit amount (if user specifies it)
  const [customDeposit, setCustomDeposit] = useState<number | null>(null);
  const [useStandardDeposit, setUseStandardDeposit] = useState(true);

  // Exchange rate (informative only for ARS)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const handleSuccess = () => {
    setSelectedProperty(0);
    setSelectedChannel(0);
    setCurrency(null);
    setTotalPrice(0);
    setCustomDeposit(null);
    setUseStandardDeposit(true);
    setExchangeRate(null);
    router.refresh();
    router.push("/");
  };

  // Fetch unavailable dates when property changes
  const [dynamicDatesUnavailable, setDynamicDatesUnavailable] =
    useState<Array<{ check_in: string | Date; check_out: string | Date }>>(
      datesUnavailable,
    );

  useEffect(() => {
    if (selectedProperty && selectedProperty > 0) {
      fetch(`/api/booking/unavailable-dates?propertyId=${selectedProperty}`)
        .then((res) => res.json())
        .then((data) => setDynamicDatesUnavailable(data))
        .catch((error) => {
          console.error("Error loading unavailable dates:", error);
        });
    }
  }, [selectedProperty]);

  const parseLocalDate = (dateVal: string | Date) => {
    const dateStr =
      dateVal instanceof Date
        ? dateVal.toISOString().split("T")[0]
        : String(dateVal).split("T")[0];
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const checkInDisabledRanges = useMemo(
    () =>
      dynamicDatesUnavailable.map((r) => {
        const start = parseLocalDate(r.check_in);
        const end = parseLocalDate(r.check_out);
        end.setDate(end.getDate() - 1);
        return { start, end };
      }),
    [dynamicDatesUnavailable],
  );

  const checkOutDisabledRanges = useMemo(
    () =>
      dynamicDatesUnavailable.map((r) => {
        const start = parseLocalDate(r.check_in);
        const end = parseLocalDate(r.check_out);
        start.setDate(start.getDate() + 1);
        return { start, end };
      }),
    [dynamicDatesUnavailable],
  );

  // Calculate deposit and balance for LIVE PREVIEW
  const finalDeposit = useStandardDeposit
    ? totalPrice * 0.3
    : customDeposit || 0;
  const finalBalance = totalPrice - finalDeposit;

  // Calculate informative USD equivalent when ARS
  const equivalentUSD =
    exchangeRate && currency === 1 ? totalPrice / exchangeRate : null;

  const handlePriceChange = (newPrice: number) => {
    setTotalPrice(newPrice);
  };

  const handleStandardDepositToggle = (checked: boolean) => {
    setUseStandardDeposit(checked);
    if (checked) {
      setCustomDeposit(null);
    }
  };

  const handleCustomDepositChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const digits = e.target.value.replace(/\D/g, "");
    const value = parseFloat(digits || "0");
    setCustomDeposit(value);
    setUseStandardDeposit(false);
  };

  const handleExchangeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    const value = parseFloat(digits || "0");
    setExchangeRate(value || null);
  };

  return (
    <ReusableForm
      action={createBooking}
      title="Nueva Reserva"
      submitText="Crear Reserva"
      submitinText="Creando..."
      sections
      centered
      onSuccess={handleSuccess}
    >
      {/* ── Huésped ── */}
      <BookingFormSection
        icon={<User className="h-4 w-4" />}
        title="Huésped"
        cols={2}
        animationDelay={0}
      >
        <FormField
          type="text"
          name="tenant_name"
          label="Nombre completo"
          placeholder="Ej. Juan García"
          required
        />
        <FormField
          type="phone"
          name="guest_phone"
          label="Teléfono"
          placeholder="3329305210"
          defaultCountry="AR"
        />
      </BookingFormSection>

      {/* ── Propiedad ── */}
      <BookingFormSection
        icon={<Home className="h-4 w-4" />}
        title="Propiedad"
        cols={1}
        animationDelay={120}
      >
        <FormField
          type="select"
          name="property_id"
          label="Selecciona una propiedad"
          options={[
            { value: "", label: "Seleccionar propiedad" },
            ...(properties?.map((prop) => ({
              value: prop.id,
              label: prop.name,
            })) ?? []),
          ]}
          required
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedProperty(Number(e.target.value))
          }
        />
      </BookingFormSection>

      {/* ── Estadía ── */}
      <BookingFormSection
        icon={<Calendar className="h-4 w-4" />}
        title="Estadía"
        cols={3}
        animationDelay={80}
      >
        <FormField
          type="date"
          name="check_in"
          label="Check in"
          disablePastDates
          required
          disabledRanges={checkInDisabledRanges}
        />
        <FormField
          type="date"
          name="check_out"
          label="Check out"
          disablePastDates
          required
          disabledRanges={checkOutDisabledRanges}
        />
        <FormField type="checkbox" name="noon" label="Medio día" />
      </BookingFormSection>

      {/* ── Financiero ── */}
      <BookingFormSection
        icon={<Banknote className="h-4 w-4" />}
        title="Financiero"
        cols={3}
        animationDelay={160}
      >
        <FormField
          type="select"
          name="currency"
          label="Moneda"
          options={[
            { value: "", label: "Seleccionar" },
            { value: 1, label: "ARS" },
            { value: 2, label: "USD" },
          ]}
          required
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setCurrency(Number(e.target.value))
          }
        />

        {/* Precio Total */}
        <div
          key={`price-${currency}`}
          className="animate-in fade-in-0 duration-200"
        >
          {currency === 1 ? (
            <PriceInput
              name="booking_total_price_ars"
              label="Precio total ARS"
              currency="ARS"
              required
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const digits = e.target.value.replace(/\D/g, "");
                handlePriceChange(parseFloat(digits || "0"));
              }}
            />
          ) : (
            <PriceInput
              name="booking_total_price_usd"
              label="Precio total USD"
              currency="USD"
              required
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const digits = e.target.value.replace(/\D/g, "");
                handlePriceChange(parseFloat(digits || "0"));
              }}
            />
          )}
        </div>

        {/* Anticipo: Checkbox para 30% estándar + Input personalizado */}
        <div
          key={`deposit-control-${currency}`}
          className="animate-in fade-in-0 duration-200"
        >
          <div className="flex flex-col">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Anticipo
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="use_standard_deposit"
                checked={useStandardDeposit}
                onChange={(e) => handleStandardDepositToggle(e.target.checked)}
                className="w-4 h-4 rounded border-border cursor-pointer"
              />
              <label
                htmlFor="use_standard_deposit"
                className="text-sm cursor-pointer"
              >
                Usar 30% estándar
              </label>
            </div>

            {useStandardDeposit ? (
              <div className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground flex items-center opacity-60">
                {currency === 1
                  ? `$${finalDeposit.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                  : `USD ${finalDeposit.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
              </div>
            ) : (
              <PriceInput
                name="anticipo_custom"
                label=""
                currency={currency === 1 ? "ARS" : "USD"}
                placeholder={`Ej. ${(totalPrice * 0.5).toFixed(0)}`}
                value={customDeposit || ""}
                onChange={handleCustomDepositChange}
              />
            )}
          </div>
          {/* Hidden fields para enviar al servidor */}
          <input
            type="hidden"
            name={currency === 1 ? "deposit_amount_ars" : "deposit_amount_usd"}
            value={useStandardDeposit ? "" : customDeposit || ""}
          />
        </div>

        {/* Saldo: Solo lectura, calculado automáticamente */}
        <div
          key={`balance-${currency}`}
          className="animate-in fade-in-0 duration-200"
        >
          <div className="flex flex-col">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Saldo {currency === 1 ? "ARS" : "USD"}
            </label>
            <div className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground flex items-center opacity-60 cursor-not-allowed">
              {currency === 1
                ? `$${finalBalance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                : `USD ${finalBalance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Se calcula como: Total - Anticipo
            </p>
          </div>
        </div>

        {/* Tipo de Cambio: Solo informativo para ARS */}
        {currency === 1 && (
          <div
            key={`exchange-rate-${currency}`}
            className="animate-in fade-in-0 duration-200"
          >
            <PriceInput
              name="deposit_exchange_rate"
              label="Tipo de cambio (informativo)"
              currency="TC"
              placeholder="Ej. 45.50"
              value={exchangeRate || ""}
              onChange={handleExchangeRateChange}
            />
            <input
              type="hidden"
              name="deposit_exchange_rate"
              value={exchangeRate || ""}
            />
          </div>
        )}

        {/* USD Equivalence Display (informativo para ARS) */}
        {currency === 1 && equivalentUSD && (
          <div
            key={`usd-equiv-${currency}`}
            className="animate-in fade-in-0 duration-200 col-span-1"
          >
            <div className="flex flex-col">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Equivalencia USD
              </label>
              <div className="w-full h-10 rounded-lg border border-border bg-blue-50 px-3 py-2 text-sm text-foreground flex items-center">
                USD{" "}
                {equivalentUSD.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Referencia: Total ARS ÷ Tipo de cambio
              </p>
            </div>
          </div>
        )}
      </BookingFormSection>

      {/* ── Reserva ── */}
      <BookingFormSection
        icon={<Tag className="h-4 w-4" />}
        title="Reserva"
        cols={3}
        animationDelay={240}
      >
        <FormField
          type="select"
          name="channel_id"
          label="Canal"
          options={[
            { value: "", label: "Seleccionar" },
            ...(CHANNELS?.map((ch) => ({
              value: ch.id,
              label: ch.channel_name,
            })) ?? []),
          ]}
          required
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedChannel(Number(e.target.value))
          }
        />
        <FormField
          type="select"
          name="tenant_quantity"
          label="Cantidad de personas"
          options={[
            { value: "", label: "Seleccionar" },
            ...(maxGuests > 0
              ? Array.from({ length: maxGuests }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                }))
              : Array.from({ length: 9 }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                }))),
          ]}
          required
        />
        <FormField
          type="select"
          name="booking_adv"
          label="Publicidad"
          options={[
            { value: "", label: "Seleccionar" },
            { value: "true", label: "Sí" },
            { value: "false", label: "No" },
          ]}
          required
        />
      </BookingFormSection>

      {/* ── Notas ── */}
      <BookingFormSection
        icon={<MessageSquare className="h-4 w-4" />}
        title="Notas"
        cols={1}
        animationDelay={320}
      >
        <FormField
          type="textarea"
          name="observations"
          label="Observaciones"
          placeholder="Notas internas sobre la reserva, preferencias del huésped, etc."
          rows={3}
          maxLength={500}
        />
      </BookingFormSection>
    </ReusableForm>
  );
}
