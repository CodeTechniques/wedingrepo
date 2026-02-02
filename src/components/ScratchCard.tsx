import React, { useRef, useEffect, useState, useCallback } from 'react';
import goldenGlitterHeart from '@/assets/golden-glitter-heart.png';

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
  const glitterCanvasRef = useRef<HTMLCanvasElement>(null);
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

  // Heart shape path
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
      // Create heart path for clipping
      const path = new Path2D(heartPath);
      
      // Clip to heart shape and draw the glitter image WITHOUT shadow
      ctx.save();
      ctx.clip(path);
      
      // Draw golden glitter heart image slightly larger to ensure full coverage
      const scale = 1.2;
      const offsetX = (width * scale - width) / 2;
      const offsetY = (height * scale - height) / 2;
      
      ctx.drawImage(img, -offsetX, -offsetY, width * scale, height * scale);
      
      ctx.restore();
      
      // Add subtle highlight overlay for 3D embossed look
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
    
    // Mark as revealed when user has scratched enough
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
      {/* 3D Embossed white heart with revealed content */}
      <div className="absolute inset-0">
        <svg width={width} height={height} className="absolute inset-0">
          <defs>
            <clipPath id="heartClip">
              <path d={heartPath} />
            </clipPath>
            
            {/* Inset/Recessed 3D filter - carved INTO the surface */}
            <filter id="emboss3d" x="-50%" y="-50%" width="200%" height="200%">
              {/* Inner shadow (top-left) to create recessed look */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="-2" dy="-2" result="offsetblur1"/>
              <feFlood floodColor="#000000" floodOpacity="0.3"/>
              <feComposite in2="offsetblur1" operator="in" result="innershadow1"/>
              
              {/* Inner shadow (bottom-right) for depth */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="1" dy="1" result="offsetblur2"/>
              <feFlood floodColor="#ffffff" floodOpacity="0.6"/>
              <feComposite in2="offsetblur2" operator="in" result="innershadow2"/>
              
              {/* Combine shadows */}
              <feMerge>
                <feMergeNode in="innershadow1"/>
                <feMergeNode in="innershadow2"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Gradient for recessed/carved look */}
            <linearGradient id="whiteHeartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8e8e8"/>
              <stop offset="25%" stopColor="#f0f0f0"/>
              <stop offset="50%" stopColor="#f5f5f5"/>
              <stop offset="75%" stopColor="#f8f8f8"/>
              <stop offset="100%" stopColor="#ffffff"/>
            </linearGradient>
          </defs>
          
          {/* Main white heart with inset/recessed gradient */}
          <path d={heartPath} fill="url(#whiteHeartGradient)" filter="url(#emboss3d)" />
          
          {/* Dark inner edge for carved-in effect */}
          <path 
            d={heartPath} 
            fill="none" 
            stroke="rgba(0,0,0,0.1)" 
            strokeWidth="1"
          />
        </svg>
        
        {/* Revealed content inside heart */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          style={{ 
            clipPath: `path('${heartPath}')`,
            paddingTop: '15%',
            paddingBottom: '10%'
          }}
        >
          <p 
            className="italic text-xs sm:text-sm tracking-wide"
            style={{ 
              color: '#7A7A7A', 
              marginBottom: '2px', 
              lineHeight: '1.2',
              fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Didot', serif"
            }}
          >
            invite you to celebrate
          </p>
          <p 
            className="italic text-xs sm:text-sm tracking-wide"
            style={{ 
              color: '#7A7A7A', 
              marginBottom: '8px', 
              lineHeight: '1.2',
              fontFamily: "'Playfair Display', 'Cormorant Garamond', 'Didot', serif"
            }}
          >
            wedding on
          </p>
          
          <p 
            className="text-base sm:text-lg font-bold tracking-wide"
            style={{ 
              color: '#000000', 
              marginBottom: '4px', 
              lineHeight: '1',
              fontFamily: "'Playfair Display', 'Bodoni Moda', 'Didot', serif"
            }}
          >
            22 | 23 | 25
          </p>
          
          <p 
            className="text-sm sm:text-base font-semibold tracking-wide"
            style={{ 
              color: '#000000', 
              marginBottom: '8px', 
              lineHeight: '1',
              fontFamily: "'Playfair Display', 'Bodoni Moda', 'Didot', serif"
            }}
          >
            April, 2026
          </p>
          
          <p 
            className="text-[10px] sm:text-xs tracking-widest uppercase"
            style={{ 
              color: '#6B6B6B',
              fontFamily: "'Montserrat', 'Raleway', sans-serif",
              letterSpacing: '0.15em'
            }}
          >
            New Delhi, India
          </p>
          
          <p 
            className="italic text-[10px] sm:text-xs mt-3 tracking-wide font-bold save-the-date-text"
            style={{ 
              color: '#7A7A7A',
              fontFamily: "'Playfair Display', 'Cormorant Garamond', serif"
            }}
          >
            Save the Date
          </p>
        </div>
      </div>
      
      {/* 3D Gold scratch overlay canvas - NO DROP SHADOW */}
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