import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

/**
 * Floating "Make Your Own" button that appears on mobile after the user
 * scrolls past the hero section. Hidden on desktop and on the homepage
 * when the upload section is in view.
 */
export const MobileStickyCTA = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling 400px (past hero on most pages)
      // Hide when near the upload section on homepage
      const scrolled = window.scrollY;
      const makeSection = document.querySelector('#make-your-own');
      const sectionTop = makeSection?.getBoundingClientRect().top ?? Infinity;
      const sectionVisible = sectionTop < window.innerHeight && sectionTop > 0;

      setVisible(scrolled > 400 && !sectionVisible);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.querySelector('#make-your-own')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      document.querySelector('#make-your-own')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  return (
    <Link
      to="/#make-your-own"
      onClick={handleClick}
      className="lg:hidden fixed bottom-20 right-4 z-[9997] inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-display text-xs uppercase tracking-wider font-bold animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <Sparkles className="h-4 w-4" />
      Reveal Your Game
    </Link>
  );
};

export default MobileStickyCTA;
