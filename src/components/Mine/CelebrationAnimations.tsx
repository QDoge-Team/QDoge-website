'use client';
import React, { useEffect, useState, useRef } from 'react';

interface CelebrationAnimationsProps {
  visible: boolean;
  onComplete?: () => void;
}

interface Firework {
  id: number;
  x: number;
  y: number;
  delay: number;
  particles: number;
}

const CelebrationAnimations: React.FC<CelebrationAnimationsProps> = ({ visible, onComplete }) => {
  const [showMessage, setShowMessage] = useState(false);
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const fireworkIdRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visible) {
      setShowMessage(false);
      setFireworks([]);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Show message animation after short delay
    setTimeout(() => {
      setShowMessage(true);
    }, 500);

    // Generate initial batch of fireworks
    const generateFireworks = () => {
      const batchSize = 5;
      const newFireworks: Firework[] = Array.from({ length: batchSize }, () => ({
        id: fireworkIdRef.current++,
        x: Math.random() * 100, // Random X position (0-100%)
        y: Math.random() * 100, // Random Y position (0-100%)
        delay: 0, // Start immediately
        particles: 12, // Number of particles per firework
      }));
      setFireworks(prev => [...prev, ...newFireworks]);
    };

    // Generate initial batch
    generateFireworks();

    // Continue generating fireworks every 800ms while visible
    intervalRef.current = setInterval(() => {
      generateFireworks();
    }, 800);

    // Clean up interval on unmount or when visible becomes false
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible]);

  // Remove old fireworks after animation completes (cleanup)
  useEffect(() => {
    if (!visible || fireworks.length === 0) return;

    const cleanupTimer = setInterval(() => {
      setFireworks(prev => {
        // Keep only recent fireworks (last 50)
        if (prev.length > 50) {
          return prev.slice(-50);
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(cleanupTimer);
  }, [visible, fireworks.length]);

  if (!visible) return null;

  return (
    <>
      {/* Fireworks exploding randomly - continuously generated */}
      {fireworks.map((firework) => (
        <div
          key={firework.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: `${firework.x}%`,
            top: `${firework.y}%`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${firework.delay}ms`,
          }}
        >
          <div className="firework-container">
            {Array.from({ length: firework.particles }, (_, i) => {
              const angle = (i * 360 / firework.particles) * Math.PI / 180;
              const distance = 120 + Math.random() * 80; // Random distance 120-200px (increased from 60-100px)
              const colorIndex = Math.floor(Math.random() * 3);
              const colors = [
                'from-yellow-400 via-orange-500 to-red-500',
                'from-blue-400 via-purple-500 to-pink-500',
                'from-green-400 via-cyan-500 to-blue-500',
              ];
              return (
                <div
                  key={i}
                  className={`firework-particle bg-gradient-to-r ${colors[colorIndex]}`}
                  style={{
                    '--tx': `${Math.cos(angle) * distance}px`,
                    '--ty': `${Math.sin(angle) * distance}px`,
                    '--delay': `${Math.random() * 0.2}s`,
                  } as React.CSSProperties & { '--tx': string; '--ty': string; '--delay': string }}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Congratulatory message animation - slides from left to center, stays 4s, then slides to right */}
      {showMessage && (
        <div className="fixed top-1/2 left-0 transform -translate-y-1/2 pointer-events-none z-50 animate-message-slide">
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 animate-pulse whitespace-nowrap">
            🎉 Congratulations! 🎉
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes firework-explode {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        @keyframes firework-particle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        @keyframes message-slide {
          0% {
            transform: translateX(-100vw) translateY(-50%);
            opacity: 0;
          }
          10% {
            transform: translateX(calc(50vw - 50%)) translateY(-50%);
            opacity: 1;
          }
          90% {
            transform: translateX(calc(50vw - 50%)) translateY(-50%);
            opacity: 1;
          }
          100% {
            transform: translateX(100vw) translateY(-50%);
            opacity: 0;
          }
        }

        .firework-container {
          position: relative;
          width: 8px;
          height: 8px;
          animation: firework-explode 1.2s ease-out forwards;
        }

        .firework-particle {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: firework-particle 1.2s ease-out forwards;
          animation-delay: var(--delay);
          box-shadow: 0 0 8px currentColor, 0 0 12px currentColor;
        }

        .animate-message-slide {
          animation: message-slide 5s ease-in-out forwards;
        }
      `}</style>
    </>
  );
};

export default CelebrationAnimations;
