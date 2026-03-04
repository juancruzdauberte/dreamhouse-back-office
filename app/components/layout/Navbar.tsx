"use client";

import {
  LogOut,
  Calendar,
  LinkIcon,
  CalendarPlus2,
  ChartNoAxesCombined,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  useContext,
  createContext,
  useState,
  useMemo,
  type ReactNode,
  type FC,
} from "react";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SidebarContextType = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

type SidebarProps = {
  children: ReactNode;
};

const Sidebar: FC<SidebarProps> = ({ children }) => {
  const [expanded, setExpanded] = useState(false);
  const contextValue = useMemo(() => ({ expanded, setExpanded }), [expanded]);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`h-screen fixed left-0 top-0 z-50 bg-background/95 supports-backdrop-filter:bg-background/85 backdrop-blur border-r border-border transition-[width] duration-300 ease-in-out ${
        expanded ? "w-[240px]" : "w-[80px]"
      }`}
    >
      <TooltipProvider>
        <nav className="h-full flex flex-col justify-between">
          <div>
            <div
              className={`p-4 flex items-center relative transition-[padding,gap] duration-300 ${
                expanded ? "justify-start px-6 gap-4" : "justify-center"
              }`}
            >
              <div className="shrink-0">
                <Image
                  src="https://res.cloudinary.com/dttpgbmdx/image/upload/v1764695249/image_arimsd.png"
                  className="object-cover border border-border rounded-full"
                  width={40}
                  height={40}
                  alt="Dreamhouse Logo"
                />
              </div>

              <span
                className={`font-semibold tracking-tight text-lg text-slate-800 transition-[max-width,opacity] duration-300 overflow-hidden whitespace-nowrap block ${
                  expanded ? "max-w-[150px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Dreamhouse
              </span>
            </div>

            <div className="border-b border-border mx-4 my-2"></div>

            <SidebarContext.Provider value={contextValue}>
              <ul className="flex-1 px-3 py-2 space-y-1">{children}</ul>
            </SidebarContext.Provider>
          </div>

          <div className="p-3 border-t border-slate-100">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut()}
                  aria-label="Cerrar sesión"
                  className={`flex w-full items-center p-3 rounded-xl font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    expanded ? "justify-start" : "justify-center"
                  }`}
                >
                  <LogOut size={20} className="shrink-0" aria-hidden="true" />
                  <span
                    className={`overflow-hidden transition-[max-width,opacity,margin] duration-300 whitespace-nowrap block ${
                      expanded
                        ? "max-w-[150px] opacity-100 ml-3"
                        : "max-w-0 opacity-0 ml-0"
                    }`}
                  >
                    Cerrar Sesión
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className={`ml-2 font-medium ${expanded ? "hidden" : ""}`}
              >
                Cerrar Sesión
              </TooltipContent>
            </Tooltip>
          </div>
        </nav>
      </TooltipProvider>
    </aside>
  );
};

type SidebarItemProps = {
  icon: ReactNode;
  text: string;
  href: string;
  isExternal?: boolean;
};

const SidebarItem: FC<SidebarItemProps> = ({
  icon,
  text,
  href,
  isExternal = false,
}) => {
  const context = useContext(SidebarContext);
  const pathname = usePathname();
  const isActive = pathname === href;

  if (!context) {
    throw new Error("SidebarItem must be used within a Sidebar");
  }

  const { expanded, setExpanded } = context;

  const content = (
    <>
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span
        className={`overflow-hidden transition-[max-width,opacity,margin] duration-300 whitespace-nowrap block ${
          expanded ? "max-w-[200px] opacity-100 ml-3" : "max-w-0 opacity-0 ml-0"
        }`}
      >
        {text}
      </span>
    </>
  );

  const wrappedContent = isExternal ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={text}
      onClick={() => expanded && setExpanded(false)}
      className={`
        relative flex w-full items-center p-3 my-1
        font-medium rounded-xl transition-[background-color,color,transform] duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${expanded ? "justify-start" : "justify-center text-center"}
        ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
        }
      `}
    >
      {content}
    </a>
  ) : (
    <Link
      href={href}
      aria-label={text}
      onClick={() => expanded && setExpanded(false)}
      className={`
        relative flex w-full items-center p-3 my-1
        font-medium rounded-xl transition-[background-color,color,transform] duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${expanded ? "justify-start" : "justify-center text-center"}
        ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
        }
      `}
    >
      {content}
    </Link>
  );

  return (
    <li className="w-full">
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{wrappedContent}</TooltipTrigger>
        <TooltipContent
          side="right"
          className={`ml-2 font-medium ${expanded ? "hidden" : ""}`}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </li>
  );
};

const Navbar = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar>
        <SidebarItem
          icon={<Calendar size={20} />}
          text="Ver Reservas"
          href="/"
        />
        <SidebarItem
          icon={<ChartNoAxesCombined size={20} />}
          text="Dashboard"
          href="/dashboard"
        />
        <SidebarItem
          icon={<CalendarPlus2 size={20} />}
          text="Crear Reserva"
          href="/bookings/create"
        />

        <div className="my-2 border-t border-border/80 mx-2" />

        <SidebarItem
          icon={<LinkIcon size={20} />}
          text="Sitio Web"
          href="https://dreamhousebaradero.com/"
          isExternal
        />
      </Sidebar>

      <main
        id="main-content"
        className="flex-1 ml-[80px] w-full overflow-x-hidden"
      >
        {children}
      </main>
    </div>
  );
};
export default Navbar;
