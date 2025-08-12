import { useEffect, useState, useMemo, createContext, useContext } from "react";
import Lenis from "lenis";

// Create context with default values
const LenisContext = createContext({
  lenis: null,
  scrollTo: () => {},
});

// Hook to use the Lenis context
export const useLenis = () => useContext(LenisContext);

export default function LenisProvider({
  children,
  options: userOptions,
}) {
  const [lenis, setLenis] = useState(null);
  
  // Memoize the options to prevent recreation on each render
  const options = useMemo(() => {
    return {
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      ...userOptions,
    };
  }, [userOptions]);

  useEffect(() => {
    // Only initialize Lenis once
    if (lenis) return;
    
    const lenisInstance = new Lenis(options);

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);
    setLenis(lenisInstance);

    return () => {
      cancelAnimationFrame(rafId);
      lenisInstance.destroy();
      setLenis(null);
    };
  }, []); // Empty dependency array to run only once

  // Update options when they change
  useEffect(() => {
    if (!lenis) return;
    
    Object.entries(options).forEach(([key, value]) => {
      if (key === 'easing') return; // Skip easing function as it requires special handling
      // @ts-expect-error - Lenis has dynamic properties
      lenis[key] = value;
    });
    
    if (options.easing) {
      lenis.options.easing = options.easing;
    }
  }, [lenis, options]);

  // Create a scrollTo function that wraps the lenis scrollTo method
  const scrollTo = useMemo(() => {
    return (target, options) => {
      if (lenis) {
        lenis.scrollTo(target, options);
      }
    };
  }, [lenis]);

  // Context value
  const contextValue = useMemo(() => ({
    lenis,
    scrollTo,
  }), [lenis, scrollTo]);

  return (
    <LenisContext.Provider value={contextValue}>
      {children}
    </LenisContext.Provider>
  );
} 