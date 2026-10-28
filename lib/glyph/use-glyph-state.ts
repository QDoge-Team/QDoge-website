'use client';

import { useSyncExternalStore } from 'react';
import { getGlyphState, SERVER_GLYPH_STATE, subscribeGlyphState } from './client';

/** Live readiness of the single-use Glyph relay session (ready / preparing / error). */
export function useGlyphState() {
  return useSyncExternalStore(subscribeGlyphState, getGlyphState, () => SERVER_GLYPH_STATE);
}
