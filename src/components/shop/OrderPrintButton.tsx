import React from 'react';
import { motion } from 'framer-motion';
import { Printer, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePrintOrderStore, PrintOrderData } from '@/stores/printOrderStore';
import { useSessionStore } from '@/stores/sessionStore';

interface OrderPrintButtonProps {
  /** Visual variant of the button */
  variant?: 'default' | 'subtle' | 'icon-only' | 'luxury';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Optional custom class names */
  className?: string;
  /** Whether to show animation effects */
  animated?: boolean;
  /** Optional onClick handler (defaults to navigation) */
  onClick?: () => void;
  /** Optional order data to pre-fill the order page */
  orderData?: PrintOrderData;
}

/**
 * A stylish but not obnoxious "Order Print" button component
 * Used throughout the site near save visualization options
 */
export const OrderPrintButton: React.FC<OrderPrintButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  animated = true,
  onClick,
  orderData,
}) => {
  const navigate = useNavigate();
  const { setOrderData } = usePrintOrderStore();
  const { 
    setCurrentSimulation, 
    setSavedShareId: setSessionShareId,
    setCapturedTimelineState,
    setReturningFromOrder 
  } = useSessionStore();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (orderData) {
      // Save simulation to session store so we can restore it when returning
      if (orderData.simulation) {
        setCurrentSimulation(
          orderData.simulation, 
          orderData.pgn || '', 
          orderData.title
        );
        if (orderData.shareId) {
          setSessionShareId(orderData.shareId);
        }
      }
      
      // Capture timeline state for exact visual restoration
      if (orderData.capturedState) {
        setCapturedTimelineState({
          currentMove: orderData.capturedState.currentMove,
          lockedPieces: orderData.capturedState.lockedPieces.map(p => ({
            pieceType: p.pieceType as any,
            pieceColor: p.pieceColor as any,
          })),
          compareMode: orderData.capturedState.compareMode,
          darkMode: orderData.capturedState.darkMode,
        });
      }
      
      // Mark that we're navigating to order page for toast on return
      setReturningFromOrder(true);
      
      // Include current path as return path if not already set
      const dataWithReturnPath = {
        ...orderData,
        returnPath: orderData.returnPath || window.location.pathname,
      };
      setOrderData(dataWithReturnPath);
      navigate('/order-print');
    } else {
      // Fallback to home if no data
      navigate('/');
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-xs gap-1.5 px-3',
    md: 'h-10 text-sm gap-2 px-4',
    lg: 'h-12 text-base gap-2.5 px-6',
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Icon-only variant with tooltip
  if (variant === 'icon-only') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={handleClick}
              className={`
                inline-flex items-center justify-center rounded-md
                bg-gradient-to-r from-amber-500/10 to-amber-600/10
                border border-amber-500/20 hover:border-amber-500/40
                text-amber-600 dark:text-amber-400
                transition-all duration-300 hover:scale-105
                ${size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'}
                ${className}
              `}
              whileHover={animated ? { scale: 1.05 } : undefined}
              whileTap={animated ? { scale: 0.95 } : undefined}
            >
              <Printer className={iconSize[size]} />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-display text-xs">Order Premium Print</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Subtle variant - minimal styling
  if (variant === 'subtle') {
    return (
      <motion.button
        onClick={handleClick}
        className={`
          inline-flex items-center justify-center rounded-md
          text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400
          transition-colors duration-200
          ${sizeClasses[size]}
          ${className}
        `}
        whileHover={animated ? { scale: 1.02 } : undefined}
        whileTap={animated ? { scale: 0.98 } : undefined}
      >
        <Printer className={iconSize[size]} />
        <span className="font-display tracking-wide">Order Print</span>
      </motion.button>
    );
  }

  // Luxury variant - premium feel with gradient
  if (variant === 'luxury') {
    return (
      <motion.button
        onClick={handleClick}
        className={`
          relative inline-flex items-center justify-center rounded-lg overflow-hidden
          bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500
          text-stone-900 font-semibold
          shadow-lg shadow-amber-500/20
          transition-all duration-300
          ${sizeClasses[size]}
          ${className}
        `}
        whileHover={animated ? { scale: 1.03, boxShadow: '0 10px 40px -10px rgba(245, 158, 11, 0.4)' } : undefined}
        whileTap={animated ? { scale: 0.97 } : undefined}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3,
            ease: 'easeInOut' 
          }}
        />
        <Sparkles className={`${iconSize[size]} relative z-10`} />
        <span className="relative z-10 font-display tracking-wide uppercase">Order Print</span>
      </motion.button>
    );
  }

  // Default variant - balanced styling
  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={`
        border-amber-500/30 hover:border-amber-500/50
        bg-gradient-to-r from-amber-500/5 to-amber-600/5
        hover:from-amber-500/10 hover:to-amber-600/10
        text-amber-700 dark:text-amber-400
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <motion.span
        className="inline-flex items-center gap-2"
        whileHover={animated ? { scale: 1.02 } : undefined}
      >
        <Printer className={iconSize[size]} />
        <span className="font-display tracking-wide">Order Print</span>
      </motion.span>
    </Button>
  );
};

export default OrderPrintButton;
