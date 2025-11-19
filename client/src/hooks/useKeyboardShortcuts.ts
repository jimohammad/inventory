import { useEffect } from "react";
import { useLocation } from "wouter";

export function useKeyboardShortcuts() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N: New Purchase Order
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setLocation("/purchase-orders/new");
      }

      // Ctrl+I or Cmd+I: New Item
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        setLocation("/items/new");
      }

      // Ctrl+K or Cmd+K: Focus search (if on dashboard)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Ctrl+H or Cmd+H: Go to Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        setLocation("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation]);
}
