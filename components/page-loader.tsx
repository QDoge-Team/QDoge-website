'use client';

import React, { useEffect, useState } from 'react';

type PageLoaderProps = {
  children: React.ReactNode;
};

/**
 * PageLoader
 * A simple "ScaleLoader"-style spinner shown before rendering children.
 * It mimics a bar-scale loader: multiple vertical bars scaling up/down.
 */
const PageLoader: React.FC<PageLoaderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-surface'>
        <div className='relative z-10 flex flex-col items-center gap-4 font-mono text-center'>
          {/* ScaleLoader-style bars */}
          <div className='flex items-end gap-1'>
            {[0, 1, 2, 3, 4].map((i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div
                key={i}
                className='w-1.5 h-6 bg-cyan-400 qdoge-scale-bar'
                style={{
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
          <div className='text-xs tracking-[0.3em] uppercase text-cyan-400'>
            LOADING
          </div>
        </div>

        <style jsx global>{`
          @keyframes scale-bar {
            0%,
            100% {
              transform: scaleY(0.3);
            }
            40% {
              transform: scaleY(1.4);
            }
            60% {
              transform: scaleY(0.7);
            }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default PageLoader;


