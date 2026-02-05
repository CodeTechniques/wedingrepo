import React, { useRef, useEffect, useState, useCallback } from 'react';
import goldenGlitterHeart from '@/assets/golden-glitter-heart8.png';
import whiteHeart from '@/assets/white_hart.png';

interface GlitterParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

interface ScratchCardProps {
  width?: number;
  height?: number;
  onComplete?: () => void;
}

const ScratchCard: React.FC<ScratchCardProps> = ({
  width = 280,
  height = 260,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [particles, setParticles] = useState<GlitterParticle[]>([]);
  const particleIdRef = useRef(0);
  const animationFrameRef = useRef<number>();

  // Spawn glitter particles at scratch position
  const spawnGlitter = useCallback((x: number, y: number) => {
    const newParticles: GlitterParticle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 4 + 2,
        opacity: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
        life: 1,
      });
    }
    setParticles(prev => [...prev.slice(-50), ...newParticles]);
  }, []);

  // Animate glitter particles
  useEffect(() => {
    const animate = () => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity
            rotation: p.rotation + p.rotationSpeed,
            life: p.life - 0.02,
            opacity: p.life,
          }))
          .filter(p => p.life > 0)
      );
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    if (particles.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles.length > 0]);

  // Heart shape path for clipping
  const heartPath = `
    M ${width/2} ${height * 0.92}
    C ${width * 0.15} ${height * 0.65} ${width * 0.05} ${height * 0.4} ${width * 0.05} ${height * 0.3}
    C ${width * 0.05} ${height * 0.12} ${width * 0.2} ${height * 0.05} ${width * 0.35} ${height * 0.05}
    C ${width * 0.45} ${height * 0.05} ${width * 0.48} ${height * 0.12} ${width/2} ${height * 0.2}
    C ${width * 0.52} ${height * 0.12} ${width * 0.55} ${height * 0.05} ${width * 0.65} ${height * 0.05}
    C ${width * 0.8} ${height * 0.05} ${width * 0.95} ${height * 0.12} ${width * 0.95} ${height * 0.3}
    C ${width * 0.95} ${height * 0.4} ${width * 0.85} ${height * 0.65} ${width/2} ${height * 0.92}
    Z
  `;

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    
    // Load the golden glitter heart image
    const img = new Image();
    img.src = goldenGlitterHeart;
    img.onload = () => {
      // Draw the golden glitter heart image directly without clipping
      // This will cover the entire canvas area
      ctx.drawImage(img, 0, 0, width, height);
      
      // Add subtle highlight overlay for depth
      const path = new Path2D(heartPath);
      ctx.save();
      ctx.clip(path);
      const highlightGradient = ctx.createLinearGradient(0, 0, width * 0.5, height * 0.5);
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = highlightGradient;
      ctx.fill(path);
      ctx.restore();
    };

  }, [width, height, heartPath]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Spawn glitter when scratching
    spawnGlitter(x, y);

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++;
    }
    
    const percent = (transparentPixels / (pixels.length / 4)) * 100;
    setScratchPercent(percent);
    
    if (percent > 50 && !isRevealed) {
      setIsRevealed(true);
      onComplete?.();
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsScratching(true);
    const pos = getPosition(e);
    scratch(pos.x, pos.y);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching) return;
    e.preventDefault();
    const pos = getPosition(e);
    scratch(pos.x, pos.y);
  };

  const handleEnd = () => {
    setIsScratching(false);
  };

  return (
    <div 
      className="relative select-none"
      style={{ width, height }}
    >
      {/* White heart image background with revealed content */}
      <div className="absolute inset-0">
        <img 
          src={whiteHeart} 
          alt="Heart background" 
          className="absolute inset-0 w-full h-full object-contain"
        />
        
        {/* Revealed content inside heart - OPTIMIZED TEXT SIZES */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
          style={{ 
            clipPath: `path('${heartPath}')`,
            paddingTop: '18%',
            paddingBottom: '12%'
          }}
        >
          <p 
            className="italic text-sm sm:text-base tracking-wide"
            style={{ 
              color: '#7A7A7A', 
              marginBottom: '2px', 
              lineHeight: '1.2',
              fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Didot', 'Bodoni Moda', serif"
            }}
          >
         Join us, 
          </p>
          <p 
            className="italic text-sm sm:text-base tracking-wide"
            style={{ 
              color: '#7A7A7A', 
              marginBottom: '10px', 
              lineHeight: '1.2',
              fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Didot', 'Bodoni Moda', serif"
            }}
          >
          as our forever begins
          </p>
          
          <p 
            className="text-xl sm:text-2xl font-bold tracking-wide"
            style={{ 
              color: '#000000', 
              marginBottom: '5px', 
              lineHeight: '1',
              fontFamily: "'Playfair Display', 'Bodoni Moda', 'Didot', 'Cormorant Garamond', serif"
            }}
          >
            22 | 23 | 25
          </p>
          
          <p 
            className="text-base sm:text-lg font-semibold tracking-wide"
            style={{ 
              color: '#000000', 
              marginBottom: '10px', 
              lineHeight: '1',
              fontFamily: "'Playfair Display', 'Bodoni Moda', 'Didot', 'Cormorant Garamond', serif"
            }}
          >
            April, 2026
          </p>
          
          <p 
            className="text-xs sm:text-sm tracking-widest uppercase"
            style={{ 
              color: '#6B6B6B',
              fontFamily: "'Playfair Display', 'Bodoni Moda', 'Cormorant Garamond', 'Didot', serif",
              letterSpacing: '0.15em'
            }}
          >
            New Delhi, India
          </p>
          
          <p 
            className="italic text-xs sm:text-sm mt-3 tracking-wide font-bold save-the-date-text"
            style={{ 
              color: '#7A7A7A',
              fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Didot', 'Bodoni Moda', serif"
            }}
          >
  
          </p>
        </div>
      </div>
      
      {/* Gold scratch overlay canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-pointer touch-none z-20"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />

      {/* Flying glitter particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute pointer-events-none z-30"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            transform: `rotate(${particle.rotation}deg)`,
            background: `linear-gradient(135deg, #D4C4A8, #C9B896, #B8A67D)`,
            borderRadius: particle.size > 3 ? '2px' : '50%',
            boxShadow: '0 0 4px rgba(201, 184, 150, 0.8)',
          }}
        />
      ))}
      
      {/* Hint text */}
      {!isRevealed && scratchPercent < 10 && (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground text-[10px] sm:text-xs font-sans tracking-wider animate-pulse whitespace-nowrap z-30">
          Scratch to reveal ✨
        </div>
      )}
    </div>
  );
};

export default ScratchCard;