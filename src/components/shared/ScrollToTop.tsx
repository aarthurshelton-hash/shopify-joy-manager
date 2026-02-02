import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that scrolls window to top on route changes
 * Place this inside BrowserRouter but outside Routes
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use instant to avoid animation delay
    });
  }, [pathname]);

  return null;
}
