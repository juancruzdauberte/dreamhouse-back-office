import { AuthGuard } from "../components/AuthGuard";
import Navbar from "../components/layout/Navbar";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Navbar>{children}</Navbar>
    </AuthGuard>
  );
}
