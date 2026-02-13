"use client";

import {
  ChevronLast,
  ChevronFirst,
  LogOut,
  Calendar,
  LinkIcon,
  CalendarPlus2,
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
      className={`h-screen fixed left-0 top-0 z-50 bg-white border-r border-slate-200 shadow-xl transition-all duration-300 ease-in-out ${
        expanded ? "w-[280px]" : "w-[90px]"
      }`}
    >
      <nav className="h-full flex flex-col justify-between">
        <div>
          <div
            className={`p-4 flex items-center relative transition-all duration-300 ${
              expanded ? "justify-between" : "justify-center flex-col"
            }`}
          >
            <div
              className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${
                expanded ? "w-auto" : "w-0 mt-2"
              }`}
            >
              <Image
                src="https://res.cloudinary.com/dttpgbmdx/image/upload/v1764695249/image_arimsd.png"
                className="object-cover border border-slate-300 rounded-full"
                width={50}
                height={50}
                alt="Dreamhouse Logo"
              />
              <span
                className={`font-bold text-lg text-slate-800 whitespace-nowrap ${!expanded && "hidden"}`}
              >
                Dreamhouse
              </span>
            </div>
            {/* Logo for collapsed state */}
            {!expanded && (
              <div className="mt-10 transition-all duration-300">
                <Image
                  src="https://res.cloudinary.com/dttpgbmdx/image/upload/v1764695249/image_arimsd.png"
                  className="object-cover border border-slate-300 rounded-full"
                  width={50}
                  height={50}
                  alt="Dreamhouse Logo"
                />
              </div>
            )}

            <button
              onClick={() => setExpanded((curr) => !curr)}
              className={`p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all duration-300 absolute shadow-md border border-blue-100 z-50 ${
                expanded
                  ? "right-3 top-6 cursor-pointer"
                  : "left-1/2 -translate-x-1/2 top-3 cursor-pointer"
              }`}
            >
              {expanded ? (
                <ChevronFirst size={20} />
              ) : (
                <ChevronLast size={20} />
              )}
            </button>
          </div>

          <div className="border-b border-slate-100 mx-4 my-2"></div>

          <SidebarContext.Provider value={{ expanded }}>
            <ul className="flex-1 px-3 space-y-1">{children}</ul>
          </SidebarContext.Provider>
        </div>

        <div className="border-t border-slate-100 p-3">
          <button
            onClick={() => signOut()}
            className={`
              flex items-center w-full p-3
              font-medium rounded-lg cursor-pointer
              transition-all duration-200 group
              hover:bg-red-50 text-slate-600 hover:text-red-600
              ${!expanded && "justify-center"}
            `}
          >
            <LogOut size={20} />
            <span
              className={`overflow-hidden transition-all duration-300 ${
                expanded ? "w-52 ml-3 text-start" : "w-0"
              }`}
            >
              Cerrar Sesión
            </span>
            {!expanded && (
              <div
                className={`
                  absolute left-full rounded-md px-2 py-1 ml-6
                  bg-slate-900 text-white text-xs
                  invisible opacity-20 -translate-x-3 transition-all
                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                  whitespace-nowrap z-50 pointer-events-none
              `}
              >
                Cerrar Sesión
              </div>
            )}
          </button>
        </div>
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
        relative flex items-center my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
        ${!expanded && "justify-center"}
        ${expanded && "p-2"}
        ${
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
            : "hover:bg-blue-50 text-slate-600 hover:text-blue-600"
        }
    `}
    >
      {icon}
      <span
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "w-52 ml-3" : "w-0"
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
          absolute left-full rounded-md px-2 py-1 ml-3
          bg-blue-900 text-white text-xs
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
          whitespace-nowrap z-50 pointer-events-none
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
        relative flex items-center my-1
        font-medium rounded-lg cursor-pointer
        transition-colors group
        ${!expanded && "justify-center"}
         ${expanded && "p-2"}
        ${
          isActive
            ? "bg-blues-600 text-white shadow-md shadow-blue-200"
            : "hover:bg-blue-50 text-slate-600 hover:text-blue-600"
        }
    `}
    >
      {icon}
      <span
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "w-52 ml-3" : "w-0"
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
          absolute left-full rounded-md px-2 py-1 ml-3
          bg-blue-900 text-white text-xs
          invisible opacity-20 -translate-x-3 transition-all
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
          whitespace-nowrap z-50 pointer-events-none
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar>
        <SidebarItem
          icon={<Calendar size={20} />}
          text="Ver Reservas"
          href="/"
        />
        <SidebarItem
          icon={<CalendarPlus2 size={20} />}
          text="Crear Reserva"
          href="/bookings/create"
        />

        <SidebarLinkItem
          icon={<LinkIcon size={20} />}
          text="Ver web"
          href="https://dreamhousebaradero.com/"
        />
      </Sidebar>

      <main className="flex-1 ml-[80px] p-8 w-full transition-all duration-300">
        {children}
      </main>
    </div>
  );
};
export default Navbar;
