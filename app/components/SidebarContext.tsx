'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

interface SidebarContextType {
  isOpen:   boolean;
  isMobile: boolean;
  toggle:   () => void;
  close:    () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen:   true,
  isMobile: false,
  toggle:   () => {},
  close:    () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen,   setIsOpen]   = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const applyBreakpoint = useCallback((width: number) => {
    if (width < 768) {
      setIsMobile(true);
      setIsOpen(false);
    } else if (width < 1024) {
      
      setIsMobile(false);
      setIsOpen(false);
    } else {
      
      setIsMobile(false);
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    applyBreakpoint(window.innerWidth);

    const onResize = () => applyBreakpoint(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [applyBreakpoint]);

  const toggle = () => setIsOpen(prev => !prev);
  const close  = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isOpen, isMobile, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
