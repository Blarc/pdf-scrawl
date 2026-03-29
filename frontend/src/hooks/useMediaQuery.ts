import { useState, useEffect, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => {};
      const media = window.matchMedia(query);
      
      // Modern browsers
      if (media.addEventListener) {
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
      } else {
        // Older browsers
        // @ts-ignore
        media.addListener(onChange);
        // @ts-ignore
        return () => media.removeListener(onChange);
      }
    },
    () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false),
    () => false
  );
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    
    // Also use matchMedia to be extra sure
    const media = window.matchMedia('(max-width: 768px)');
    const mediaListener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    
    if (media.addEventListener) {
      media.addEventListener('change', mediaListener);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (media.removeEventListener) {
        media.removeEventListener('change', mediaListener);
      }
    };
  }, []);

  return isMobile;
}
