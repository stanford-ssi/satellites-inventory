'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  sidebarWidth: number;
  isMobile: boolean;
  isOpen: boolean;
  toggle: () => void;
  setSidebarWidth: (width: number) => void;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(224); // Default 224px (w-56)
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const MIN_WIDTH = 64; // Minimum collapsed width
  const MAX_WIDTH = 400; // Maximum expanded width

  // Load sidebar width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
        setSidebarWidth(width);
      }
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggle = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    }
  };

  const handleSetSidebarWidth = (width: number) => {
    if (!isMobile) {
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
      setSidebarWidth(clampedWidth);
      localStorage.setItem('sidebar-width', clampedWidth.toString());
    }
  };

  const setMobileOpen = (open: boolean) => {
    if (isMobile) {
      setIsOpen(open);
    }
  };

  return (
    <SidebarContext.Provider
      value={{
        sidebarWidth,
        isMobile,
        isOpen,
        toggle,
        setSidebarWidth: handleSetSidebarWidth,
        setMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}