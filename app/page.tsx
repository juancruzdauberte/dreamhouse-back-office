import { HomeIcon, Link } from "lucide-react";
import Sidebar, {
  SidebarItem,
  SidebarLinkItem,
} from "./components/layout/Navbar";
import CreateBookingForm from "./components/CreateBookingForm";
export default async function Page() {
  return (
    <div className="flex h-screen justify-center">
      <Sidebar>
        <SidebarItem icon={<HomeIcon />} text="Home" href="/" />
        <SidebarLinkItem
          icon={<Link />}
          text="Sitio web"
          href="https://dreamhousebaradero.com"
        />
      </Sidebar>
      <CreateBookingForm />
    </div>
  );
}
