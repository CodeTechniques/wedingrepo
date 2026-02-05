import React, { useState } from 'react';
import ScratchCard from '@/components/ScratchCard2';

const Home = () => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-4 py-8">
      {/* Top: Save the Date - NOW BOLD */}
      <h1 
        className="font-serif text-xl sm:text-2xl md:text-3xl tracking-[0.2em] uppercase z-10 mb-8 sm:mb-10 font-bold"
        style={{ color: '#2E2E2E' }}
      >
        Save The Date
      </h1>

      {/* Center: Scratch card heart - INCREASED SIZE */}
      <div className="relative z-10">
        <ScratchCard
          width={320}
          height={300}
          onComplete={() => setIsRevealed(true)}
        />
      </div>

      {/* Bottom: Names */}
      <h2 
        className="font-serif text-lg sm:text-xl md:text-2xl tracking-[0.15em] z-10 mt-10 sm:mt-12"
        style={{ color: '#2E2E2E' }}
      >
        Nishtha & Abhishek
      </h2>
    </div>
  );
};

export default Home;