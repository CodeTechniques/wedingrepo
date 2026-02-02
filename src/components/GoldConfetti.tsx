import React from 'react';

const GoldConfetti: React.FC = () => {
  // Generate random confetti pieces
  const confettiPieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 6 + 2,
    rotation: Math.random() * 360,
    opacity: Math.random() * 0.6 + 0.3,
    delay: Math.random() * 2,
    type: Math.random() > 0.5 ? 'dot' : 'line',
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: piece.left,
            top: piece.top,
            opacity: piece.opacity,
            animation: `float ${3 + piece.delay}s ease-in-out infinite`,
            animationDelay: `${piece.delay}s`,
          }}
        >
          {piece.type === 'dot' ? (
            <div
              className="rounded-full bg-gold"
              style={{
                width: piece.size,
                height: piece.size,
              }}
            />
          ) : (
            <div
              className="bg-gold"
              style={{
                width: piece.size * 2,
                height: 2,
                transform: `rotate(${piece.rotation}deg)`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default GoldConfetti;
