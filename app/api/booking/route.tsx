import { renderToStream } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { BookingDTO } from "../../lib/repository/booking/booking.dto";
import { NextResponse } from "next/server";
import { DIContainer } from "../../core/DiContainer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#334155",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
  statusConfirmed: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef9c3",
    color: "#854d0e",
  },
  statusCancelled: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  section: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  col2: {
    flex: 2,
  },
  label: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  valueHighlight: {
    color: "#4f46e5",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  priceLabel: {
    fontSize: 10,
    color: "#475569",
  },
  priceValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
  },
  paymentBox: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 5,
  },
  paymentDeposit: {
    backgroundColor: "#eff6ff",
  },
  paymentBalance: {
    backgroundColor: "#ecfdf5",
  },
  paymentTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 12,
    fontWeight: "bold",
  },
  paymentSub: {
    fontSize: 9,
    marginTop: 2,
  },
  textBlue700: { color: "#1d4ed8" },
  textBlue900: { color: "#1e3a8a" },
  textEmerald700: { color: "#047857" },
  textEmerald900: { color: "#064e3b" },
});

interface Props {
  booking: BookingDTO;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatCurrency = (amount: string | number) => {
  return `$${parseFloat(amount.toString()).toLocaleString()} USD`;
};

const formatCurrencyARS = (amount: string | number | null) => {
  return amount ? `$${parseFloat(amount.toString()).toLocaleString()} ARS` : "";
};

const BookingPDFTemplate = ({ booking }: Props) => {
  return (
    <Document title={`Reserva #${booking.id}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image
              src="https://res.cloudinary.com/dttpgbmdx/image/upload/v1758318130/dreamhouse.002.b16_ibpty8.jpg"
              style={{
                width: 70,
                height: 70,
                borderRadius: 50,
                border: "1px solid #00000",
              }}
            />
          </View>
          <View>
            <Text style={styles.title}>Reserva DH-{booking.id}</Text>
            <Text style={styles.subtitle}>
              Detalles completos de la reserva
            </Text>
          </View>
        </View>

        {/* Guest Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Huésped</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.value}>{booking.guest_name}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Cantidad de Huéspedes</Text>
              <Text style={styles.value}>
                {booking.guest_count}{" "}
                {booking.guest_count === 1 ? "persona" : "personas"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stay Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de la Estadía</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Check-in</Text>
              <Text style={styles.value}>{formatDate(booking.check_in)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Check-out</Text>
              <Text style={styles.value}>{formatDate(booking.check_out)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Noches</Text>
              <Text style={[styles.value, styles.valueHighlight]}>
                {booking.nights_stay} noches
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles de Precio</Text>

          {/* Invoice Header */}
          <View
            style={[
              styles.row,
              {
                borderBottomWidth: 1,
                borderBottomColor: "#e2e8f0",
                paddingBottom: 4,
                marginBottom: 8,
              },
            ]}
          >
            <Text style={[styles.label, { flex: 1 }]}>Concepto</Text>
            <Text style={[styles.label, { width: 100, textAlign: "right" }]}>
              Importe
            </Text>
          </View>

          {/* Invoice Items */}
          <View style={[styles.row, { marginBottom: 100 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.value}>
                Estadía ({booking.nights_stay} noches)
              </Text>
              <Text style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>
                {booking.guest_count} huéspedes
              </Text>
            </View>
            <Text style={[styles.value, { width: 100, textAlign: "right" }]}>
              {booking.total_price_usd
                ? formatCurrency(booking.total_price_usd)
                : formatCurrencyARS(booking.total_price_ars)}
            </Text>
          </View>

          {/* Invoice Total */}
          <View
            style={[
              styles.totalRow,
              {
                borderTopWidth: 1,
                borderTopColor: "#0f172a",
                paddingTop: 8,
                marginTop: 10,
              },
            ]}
          >
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {booking.total_price_usd
                ? formatCurrency(booking.total_price_usd)
                : formatCurrencyARS(booking.total_price_ars)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const preview = searchParams.get("preview");

  if (!id) {
    return new NextResponse("Missing id parameter", { status: 400 });
  }

  const booking = await DIContainer.getBookingRepository().getBooking(
    Number(id)
  );

  if (!booking) {
    return new NextResponse("Booking not found", { status: 404 });
  }

  const stream = await renderToStream(<BookingPDFTemplate booking={booking} />);

  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${
        preview ? "inline" : "attachment"
      }; filename="booking_DH-${booking.id}.pdf"`,
    },
  });
}
