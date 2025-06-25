import React, { useRef, useEffect, useCallback } from 'react';

interface Shape {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  blur: string; 
}

const shapeColorsAndBlurs = [
  { color: 'rgba(188, 149, 92, 0.4)', blur: 'blur-xl' }, 
  { color: 'rgba(105, 28, 50, 0.4)', blur: 'blur-lg' },  
  { color: 'rgba(188, 149, 92, 0.4)', blur: 'blur-md' }, 
  { color: 'rgba(105, 28, 50, 0.4)', blur: 'blur-lg' },  
  { color: 'rgba(188, 149, 92, 0.4)', blur: 'blur-md' }, 
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parseBlurToPx = (blurClass: string): number => {
    switch (blurClass) {
        case 'blur-xl': return 24;
        case 'blur-lg': return 16;
        case 'blur-md': return 12;
        default: return 8;
    }
}

const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.beginPath();
    ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
    ctx.fillStyle = shape.color;
    ctx.fill();
    ctx.closePath();
};

const DynamicBackgroundShapes: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapesRef = useRef<Shape[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  const initializeShapes = useCallback((width: number, height: number) => {
    shapesRef.current = []; // Clear existing shapes before creating new ones
    const numShapes = 5;
    for (let i = 0; i < numShapes; i++) {
      const { color, blur } = shapeColorsAndBlurs[i % shapeColorsAndBlurs.length];
      shapesRef.current.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 30 + 40,
        vx: (Math.random() - 0.5) * 0.5, // Reduced speed slightly
        vy: (Math.random() - 0.5) * 0.5, // Reduced speed slightly
        color: color,
        blur: blur,
      });
    }
  }, []); // Empty dependency array: initializeShapes reference is stable

  const updateAndDrawShapes = useCallback((timestamp: DOMHighResTimeStamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapesRef.current.forEach(shape => {
      shape.x += shape.vx;
      shape.y += shape.vy;

      if (shape.x - shape.radius < 0 || shape.x + shape.radius > canvas.width) {
        shape.vx *= -1;
        shape.x = Math.max(shape.radius, Math.min(shape.x, canvas.width - shape.radius));
      }
      if (shape.y - shape.radius < 0 || shape.y + shape.radius > canvas.height) {
        shape.vy *= -1;
        shape.y = Math.max(shape.radius, Math.min(shape.y, canvas.height - shape.radius));
      }
      drawShape(ctx, shape);
    });

    for (let i = 0; i < shapesRef.current.length; i++) {
      for (let j = i + 1; j < shapesRef.current.length; j++) {
        const shapeA = shapesRef.current[i];
        const shapeB = shapesRef.current[j];

        const dx = shapeB.x - shapeA.x;
        const dy = shapeB.y - shapeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = shapeA.radius + shapeB.radius;

        if (distance < minDistance) {
          const overlap = minDistance - distance;
          const nx = dx / distance;
          const ny = dy / distance;
          
          shapeA.x -= nx * overlap / 2;
          shapeA.y -= ny * overlap / 2;
          shapeB.x += nx * overlap / 2;
          shapeB.y += ny * overlap / 2;

          const relVx = shapeA.vx - shapeB.vx;
          const relVy = shapeA.vy - shapeB.vy;
          const dotProduct = relVx * nx + relVy * ny;

          if (dotProduct < 0) {
            const impulseStrength = dotProduct; 

            shapeA.vx -= impulseStrength * nx;
            shapeA.vy -= impulseStrength * ny;
            shapeB.vx += impulseStrength * nx;
            shapeB.vy += impulseStrength * ny;
          }
        }
      }
    }
    animationFrameIdRef.current = requestAnimationFrame(updateAndDrawShapes);
  }, []); // Empty dependency array: updateAndDrawShapes reference is stable

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parentElement = canvas.parentElement;
    if (!parentElement) return;

    // Function to set canvas size. Shapes are initialized separately.
    const sizeCanvas = () => {
        if (!canvas || !parentElement) return;
        canvas.width = parentElement.clientWidth;
        canvas.height = parentElement.clientHeight;
    };
    
    // Initialize shapes only if they haven't been initialized yet.
    // This ensures shapes are created only once on mount.
    if (shapesRef.current.length === 0) {
        sizeCanvas(); // Size canvas before initializing shapes
        initializeShapes(canvas.width, canvas.height);
    } else {
        // If shapes exist but canvas might not be sized (e.g. fast refresh), size it.
        sizeCanvas();
    }

    const resizeObserver = new ResizeObserver(entries => {
        // On resize, just update canvas dimensions. Shapes are NOT re-initialized.
        if (!canvas) return;
        for (let entry of entries) {
            // This ensures the canvas drawing buffer is updated to the new size.
            canvas.width = entry.contentRect.width;
            canvas.height = entry.contentRect.height;
        }
    });

    resizeObserver.observe(parentElement);

    // Start animation loop
    // Cancel any existing loop before starting a new one, just in case.
    if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
    }
    animationFrameIdRef.current = requestAnimationFrame(updateAndDrawShapes);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null; // Clear the ref
      }
      if (parentElement) {
         resizeObserver.unobserve(parentElement);
      }
      // It's good practice to disconnect the observer when the component unmounts.
      resizeObserver.disconnect();
    };
  }, [initializeShapes, updateAndDrawShapes]); // Dependencies are stable, effect runs once for setup.

  return (
    <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none filter blur-md opacity-60 dark:opacity-40"
        aria-hidden="true" 
    />
  );
};

export default DynamicBackgroundShapes;