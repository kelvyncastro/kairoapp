import { useNavPosition } from "@/contexts/NavPositionContext";
import { cn } from "@/lib/utils";

/**
 * Returns utility classes for spacing around the navigation bar.
 * Use these to prevent content from being hidden behind the nav.
 */
export function useNavPadding() {
  const { navPosition } = useNavPosition();

  return {
    navPosition,
    /** For bottom-fixed elements: returns the bottom offset class */
    fixedBottomClass: cn(
      navPosition === 'bottom' ? "bottom-24" : "bottom-4"
    ),
    /** Padding-bottom for scrollable content areas */
    contentPaddingBottom: cn(
      navPosition === 'bottom' ? "pb-24" : "pb-4"
    ),
    /** Full padding set for the main content area */
    contentPadding: cn(
      navPosition === 'bottom' && "pb-24",
      navPosition === 'top' && "pt-20",
      navPosition === 'left' && "pl-20",
      navPosition === 'right' && "pr-20",
    ),
  };
}
