import React from 'react';

interface LoginTransitionOverlayProps {
  // CSSTransition might pass className, accept it to allow proper class application
  className?: string;
}

const LoginTransitionOverlay = React.forwardRef<HTMLDivElement, LoginTransitionOverlayProps>(
  ({ className }, ref) => {
    return (
      <div
        ref={ref} // Attach the ref here
        className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-light-gray/80 dark:bg-neutral-900/80 backdrop-blur-sm ${className || ''}`}
        aria-hidden="true"
        role="presentation"
      >
        {/* Multiple circles with staggered delays for a more dynamic effect */}
        <div 
          className="absolute w-20 h-20 bg-custom-pink rounded-full animate-expand-and-fade" 
          style={{ animationDelay: '0s' }}
        ></div>
        <div 
          className="absolute w-20 h-20 bg-custom-gold rounded-full animate-expand-and-fade" 
          style={{ animationDelay: '0.2s' }}
        ></div>
        <div 
          className="absolute w-20 h-20 bg-pink-300 rounded-full animate-expand-and-fade" 
          style={{ animationDelay: '0.4s' }}
        ></div>
      </div>
    );
  }
);

LoginTransitionOverlay.displayName = 'LoginTransitionOverlay'; // Good practice for forwardRef

export default LoginTransitionOverlay;