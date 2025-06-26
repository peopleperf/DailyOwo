// OwoAIFloatButton.tsx
// Enhanced draggable floating AI assistant with premium design
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

interface OwoAIFloatButtonProps {
  onClick: () => void;
  isPremium: boolean;
  isLoggedIn: boolean;
}

type Position = {
  x: number;
  y: number;
  side: 'left' | 'right';
};

export function OwoAIFloatButton({ onClick, isPremium, isLoggedIn }: OwoAIFloatButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, side: 'right' });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show tooltip for discoverability on mount
    tooltipTimeout.current = setTimeout(() => setShowTooltip(true), 800);
    const hide = setTimeout(() => setShowTooltip(false), 3500);
    return () => {
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      clearTimeout(hide);
    };
  }, []);

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.innerHeight;
      const currentY = position.y + viewportHeight / 2;
      
      // Keep within bounds
      if (currentY < 80) {
        setPosition(prev => ({ ...prev, y: -viewportHeight / 2 + 80 }));
      } else if (currentY > viewportHeight - 80) {
        setPosition(prev => ({ ...prev, y: viewportHeight / 2 - 80 }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position.y]);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    setIsDragging(false);
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonWidth = 60;
    
    // Determine which side to snap to based on current position
    const currentX = info.point.x;
    const snapToRight = currentX > viewportWidth / 2;
    
    // Calculate Y position relative to center
    const centerY = viewportHeight / 2;
    const relativeY = info.point.y - centerY;
    
    // Constrain Y within viewport bounds (leaving space for the button)
    const minY = -centerY + 80;
    const maxY = centerY - 80;
    const constrainedY = Math.max(minY, Math.min(maxY, relativeY));
    
    setPosition({
      x: snapToRight ? 0 : -(viewportWidth - buttonWidth),
      y: constrainedY,
      side: snapToRight ? 'right' : 'left'
    });
  }, []);

  const handleClick = useCallback(() => {
    if (!isDragging) {
      onClick();
    }
  }, [isDragging, onClick]);

  // Robust authentication check
  if (!isLoggedIn) return null;
  
  // Additional safety check to prevent showing on public pages
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const publicPaths = [
      '/',
      '/auth/login', 
      '/auth/register', 
      '/auth/reset-password',
      '/how-it-works',
      '/verify-email'
    ];
    
    // Check exact matches and path prefixes
    const isPublicPage = publicPaths.some(path => 
      currentPath === path || 
      (path !== '/' && currentPath.startsWith(path))
    );
    
    if (isPublicPage) {
      console.log('[OwoAI] Hiding on public page:', currentPath);
      return null;
    }
  }

  const isOnRight = position.side === 'right';
  const buttonStyle = isOnRight ? {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: '2rem',
    borderBottomLeftRadius: '2rem',
  } : {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: '2rem',
    borderBottomRightRadius: '2rem',
  };

  return (
    <>
      {/* Drag constraints container */}
      <div 
        ref={constraintsRef} 
        className="fixed inset-0 pointer-events-none z-40"
        style={{ margin: '80px 0' }} // Leave space at top and bottom
      />
      
      <div className="fixed z-50 pointer-events-none" style={{ 
        right: isOnRight ? 0 : 'auto',
        left: isOnRight ? 'auto' : 0,
        top: '50%',
        transform: 'translateY(-50%)'
      }}>
        <motion.div
          className="flex flex-col items-end pointer-events-none"
          animate={{
            x: position.x,
            y: position.y,
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: isDragging ? 0 : 0.5
          }}
        >
          <motion.button
            className={`pointer-events-auto group relative overflow-hidden
              transition-all duration-300 ease-out cursor-pointer select-none
              ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'}
              ${isHovered ? 'shadow-2xl' : 'shadow-xl'}
            `}
            style={{
              background: isDragging || isHovered 
                ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,255,255,0.95) 100%)'
                : 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(12px)',
              borderTopWidth: '3px',
              borderBottomWidth: '3px',
              borderLeftWidth: isOnRight ? '3px' : '0px',
              borderRightWidth: isOnRight ? '0px' : '3px',
              borderStyle: 'solid',
              borderColor: isDragging || isHovered ? 'rgba(255,215,0,0.8)' : 'rgba(255,215,0,0.6)',
              boxShadow: isDragging || isHovered 
                ? '0 8px 32px rgba(255,215,0,0.25), 0 4px 16px rgba(0,0,0,0.1)'
                : '0 4px 24px rgba(255,215,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
              ...buttonStyle,
              width: '60px',
              height: '120px',
              padding: '12px 8px'
            }}
            drag
            dragConstraints={constraintsRef}
            dragMomentum={false}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={handleClick}
            whileTap={{ scale: 0.95 }}
            aria-label="Owo AI Assistant - Drag to reposition"
          >
            {/* Animated background glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-gold/10 opacity-0 group-hover:opacity-100"
              animate={{
                background: [
                  'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  'linear-gradient(225deg, rgba(255,215,0,0.15) 0%, rgba(255,255,255,0.1) 100%)',
                  'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* AI Brain Icon */}
            <div className="relative flex flex-col items-center justify-center h-full">
              <motion.div
                className="w-8 h-8 mb-2 rounded-lg bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center shadow-lg"
                animate={isDragging ? {} : {
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </motion.div>
              
              {/* Vertical Text */}
              <div 
                className="font-bold text-gold text-sm tracking-tight"
                style={{ 
                  writingMode: 'vertical-rl', 
                  textOrientation: 'mixed',
                  letterSpacing: '0.1em',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                OWO
              </div>
            </div>

            {/* Drag indicator dots */}
            <div className={`absolute ${isOnRight ? 'left-1' : 'right-1'} top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-40 group-hover:opacity-70 transition-opacity`}>
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="w-1 h-1 bg-gold rounded-full"
                />
              ))}
            </div>
          </motion.button>

          {/* Enhanced Tooltip */}
          <AnimatePresence>
            {(showTooltip || isHovered) && !isDragging && (
              <motion.div
                className={`absolute ${isOnRight ? 'right-16' : 'left-16'} top-1/2 -translate-y-1/2 px-4 py-3 rounded-xl shadow-xl pointer-events-none z-10`}
                style={{
                  background: 'linear-gradient(135deg, rgba(20,30,60,0.95) 0%, rgba(30,40,80,0.95) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,215,0,0.3)'
                }}
                initial={{ opacity: 0, scale: 0.8, x: isOnRight ? 10 : -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: isOnRight ? 10 : -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-white text-sm font-medium mb-1">
                  💬 Ask Owo AI anything!
                </div>
                <div className="text-gold/80 text-xs">
                  {isDragging ? 'Repositioning...' : 'Drag to move • Click to chat'}
                </div>
                
                {/* Tooltip arrow */}
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-navy transform rotate-45 ${
                    isOnRight ? '-right-1' : '-left-1'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(20,30,60,0.95) 0%, rgba(30,40,80,0.95) 100%)'
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
