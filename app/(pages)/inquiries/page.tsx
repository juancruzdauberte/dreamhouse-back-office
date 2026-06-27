import InquiryDashboard from "../../components/inquiries/InquiryDashboard";

export const metadata = { title: "Consultas | Dreamhouse" };

export default function InquiriesPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <InquiryDashboard />
    </div>
  );
}
