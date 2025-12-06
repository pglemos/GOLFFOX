"use client";

import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  isControlled?: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

const SidebarBodyContext = createContext<{ isMobile: boolean } | undefined>(
  undefined
);

export const useSidebarBody = () => {
  const context = useContext(SidebarBodyContext);
  return context || { isMobile: false };
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  // Determina se está sendo controlado externamente
  // Se openProp for undefined, não está controlado (permite hover interno)
  // Se openProp for definido, está controlado (mobile)
  const isControlled = openProp !== undefined && setOpenProp !== undefined;
  const open = isControlled ? openProp! : openState;
  const setOpen = isControlled ? setOpenProp! : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate, isControlled }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
  isMobile,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  isMobile?: boolean;
}) => {
  // Se ambos open e setOpen forem undefined, não está controlado (permite hover interno)
  // Se pelo menos um for definido, está controlado (mobile)
  const isControlled = open !== undefined || setOpen !== undefined;
  
  return (
    <SidebarProvider 
      open={isControlled ? open : undefined} 
      setOpen={isControlled ? setOpen : undefined} 
      animate={animate}
    >
      <SidebarBodyContext.Provider value={{ isMobile: isMobile ?? false }}>
        {children}
      </SidebarBodyContext.Provider>
    </SidebarProvider>
  );
};

export const SidebarBody = ({ className, children, ...rest }: React.ComponentProps<typeof motion.div>) => {
  const { open } = useSidebar();
  const { isMobile } = useSidebarBody();
  
  return (
    <>
      <DesktopSidebar className={className} {...rest}>
        {children}
      </DesktopSidebar>
      {/* Sidebar Mobile - renderizado quando aberto */}
      <AnimatePresence>
        {isMobile && open && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "md:hidden fixed top-16 sm:top-18 left-0 h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] z-50 w-[280px] sm:w-[300px] bg-white dark:bg-neutral-900 border-r border-[var(--border)] overflow-y-auto",
              "shadow-xl",
              className
            )}
            id="app-sidebar-mobile"
            role="dialog"
            aria-modal="true"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate, isControlled } = useSidebar();
  
  // Se não estiver controlado externamente, permitir hover
  const handleMouseEnter = () => {
    if (!isControlled) {
      setOpen(true)
    }
  }
  
  const handleMouseLeave = () => {
    if (!isControlled) {
      setOpen(false)
    }
  }
  
  return (
    <motion.div
      className={cn(
        "h-full hidden md:flex md:flex-col bg-white dark:bg-neutral-900 flex-shrink-0 !px-0 !py-0",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "60px") : "300px",
      }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children
}: {
  className?: string
  children?: React.ReactNode
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-neutral-800 dark:text-neutral-200 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
}) => {
  const { open, animate } = useSidebar();
  const router = useRouter();
  
  return (
    <a
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2",
        className
      )}
      onMouseEnter={() => router.prefetch(link.href)}
      onClick={(e) => { e.preventDefault(); router.push(link.href); }}
      {...props}
    >
      {link.icon}
      <motion.span
          animate={{ opacity: animate ? (open ? 1 : 0) : 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre",
            "!p-0 !m-0"
          )}
          style={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          overflow: "hidden",
        }}
      >
        {link.label}
      </motion.span>
    </a>
  );
};

