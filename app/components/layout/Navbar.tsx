"use client";

import {
  ChevronLast,
  ChevronFirst,
  LogOut,
  Calendar,
  HomeIcon,
  LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  useContext,
  createContext,
  useState,
  type ReactNode,
  type FC,
} from "react";
import Image from "next/image";

type SidebarContextType = {
  expanded: boolean;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

type SidebarProps = {
  children: ReactNode;
};

const Sidebar: FC<SidebarProps> = ({ children }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`h-screen w-[80px] fixed left-0 transition-all ${
        expanded && "w-[250px]"
      }`}
    >
      <nav className="h-full flex flex-col bg-white border-r border-gray-100 shadow-md">
        <div
          className={`p-4 pb-2 flex flex-col gap-3 ${
            expanded && "flex-row justify-between pr-8 pl-8"
          }`}
        >
          {/* Logo Section */}
          <div className="flex justify-center items-center">
            <Image
              src="https://res.cloudinary.com/dttpgbmdx/image/upload/v1758318130/dreamhouse.002.b16_ibpty8.jpg"
              className={`rounded-lg transition-all ${
                expanded ? "w-16 h-16" : "w-12 h-12"
              }`}
              width={64}
              height={64}
              alt="Dreamhouse Logo"
            />
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setExpanded((curr) => !curr)}
            className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-800 transition-colors self-center"
          >
            {expanded ? <ChevronFirst size={25} /> : <ChevronLast size={25} />}
          </button>
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200 mx-3 mb-2"></div>

        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 px-3">{children}</ul>

          <div className="flex p-3">
            <button
              onClick={() => signOut()}
              className={`
                relative flex items-center py-2 px-3 my-1 w-full
                font-medium rounded-md cursor-pointer
                transition-colors group
                hover:bg-red-50 text-gray-600 hover:text-red-600
              `}
            >
              <LogOut size={20} />
              <span
                className={`overflow-hidden transition-all ${
                  expanded ? "w-52 ml-3 text-start" : "w-0"
                }`}
              >
                Cerrar Sesión
              </span>

              {!expanded && (
                <div
                  className={`
                  absolute left-full rounded-md px-2 ml-5
                  bg-red-100 text-red-800 text-sm
                  invisible opacity-20 -translate-x-3 transition-all
                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                  whitespace-nowrap
              `}
                >
                  Cerrar Sesión
                </div>
              )}
            </button>
          </div>
        </SidebarContext.Provider>
      </nav>
    </aside>
  );
};

type SidebarItemProps = {
  icon: ReactNode;
  text: string;
  href: string;
  active?: boolean;
  alert?: boolean;
  target?: string;
};

const SidebarItem: FC<SidebarItemProps> = ({
  icon,
  text,
  href,
  alert = false,
}) => {
  const context = useContext(SidebarContext);
  const pathname = usePathname();
  const isActive = pathname === href;
  if (!context) {
    throw new Error("SidebarItem must be used within a Sidebar");
  }

  const { expanded } = context;

  return (
    <Link
      href={href}
      className={`
        relative flex items-center p-0.5 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
        ${!expanded && "justify-center"}
        ${
          isActive
            ? "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
            : "hover:bg-indigo-50 text-gray-600"
        }
    `}
    >
      {icon}
      <span
        className={`overflow-hidden transition-all ${
          expanded ? "w-52 ml-3 " : "w-0"
        }`}
      >
        {text}
      </span>
      {alert && (
        <div
          className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 ${
            expanded ? "" : "top-2"
          }`}
        />
      )}

      {!expanded && (
        <div
          className={`
          absolute left-full rounded-md px-2 ml-5
          bg-indigo-100 text-indigo-800 text-sm
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
          whitespace-nowrap
      `}
        >
          {text}
        </div>
      )}
    </Link>
  );
};

const SidebarLinkItem: FC<SidebarItemProps> = ({
  icon,
  text,
  href,
  alert = false,
}) => {
  const context = useContext(SidebarContext);
  const pathname = usePathname();
  const isActive = pathname === href;
  if (!context) {
    throw new Error("SidebarItem must be used within a Sidebar");
  }

  const { expanded } = context;

  return (
    <a
      href={href}
      target="_blank"
      className={`
        relative flex items-center p-0.5 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
        ${!expanded && "justify-center"}
        ${
          isActive
            ? "bg-gradient-to-tr from-indigo-200 to-indigo-100 text-indigo-800"
            : "hover:bg-indigo-50 text-gray-600"
        }
    `}
    >
      {icon}
      <span
        className={`overflow-hidden transition-all ${
          expanded ? "w-52 ml-3 " : "w-0"
        }`}
      >
        {text}
      </span>
      {alert && (
        <div
          className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 ${
            expanded ? "" : "top-2"
          }`}
        />
      )}

      {!expanded && (
        <div
          className={`
          absolute left-full rounded-md w-20 px-2 ml-5
          bg-indigo-100 text-indigo-800 text-sm
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
      `}
        >
          {text}
        </div>
      )}
    </a>
  );
};

const Navbar = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 ">
      <Sidebar>
        <SidebarItem
          icon={<HomeIcon size={20} />}
          text="Crear Reserva"
          href="/"
        />
        <SidebarItem
          icon={<Calendar size={20} />}
          text="Ver Reservas"
          href="/bookings"
        />
        <SidebarLinkItem
          icon={<LinkIcon size={20} />}
          text="Ver web"
          href="https://dreamhousebaradero.com/"
        />
      </Sidebar>

      <main className="flex-1 ml-[80px]">{children}</main>
    </div>
  );
};
export default Navbar;
