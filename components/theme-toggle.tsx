'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

const subscribeNoop = () => () => {};

/** True only after the client has hydrated -- the server has no theme cookie/localStorage to read. */
function useHasMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type='button'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex items-center justify-center rounded-full p-2 border border-cyan-400/30 bg-cyan-400/5 text-cyan-500 dark:text-cyan-400 hover:bg-cyan-400/15 transition-colors',
        className
      )}
    >
      {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
    </button>
  );
}
