import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type NavPosition = 'bottom' | 'top' | 'left' | 'right';

interface NavPositionContextType {
  navPosition: NavPosition;
  setNavPosition: (pos: NavPosition) => void;
}

const NavPositionContext = createContext<NavPositionContextType | undefined>(undefined);

export function NavPositionProvider({ children }: { children: ReactNode }) {
  const [navPosition, setNavPositionState] = useState<NavPosition>(() => {
    try {
      return (localStorage.getItem('kairo-nav-position') as NavPosition) || 'bottom';
    } catch {
      return 'bottom';
    }
  });

  const setNavPosition = (pos: NavPosition) => {
    setNavPositionState(pos);
    localStorage.setItem('kairo-nav-position', pos);
  };

  return (
    <NavPositionContext.Provider value={{ navPosition, setNavPosition }}>
      {children}
    </NavPositionContext.Provider>
  );
}

export function useNavPosition() {
  const context = useContext(NavPositionContext);
  if (!context) throw new Error("useNavPosition must be used within NavPositionProvider");
  return context;
}
