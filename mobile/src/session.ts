/**
 * Records one walk session from the device sensors and produces the
 * SessionTelemetry the backend validates. The app never computes rewards —
 * it reports what the sensors saw and the server decides what counts.
 */

import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import type { SessionTelemetry } from './api';

interface Fix {
  latitude: number;
  longitude: number;
}

function haversineM(a: Fix, b: Fix): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Coefficient of variation of deltas — the shaker-rig signal. */
function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export class SessionRecorder {
  private startedAt = 0;
  private steps = 0;
  private stepUpdateIntervalsMs: number[] = [];
  private lastStepUpdateAt = 0;
  private gpsDistanceM: number | null = null;
  private maxGpsJumpM = 0;
  private lastFix: Fix | null = null;
  private pedometerSub: { remove(): void } | null = null;
  private locationSub: { remove(): void } | null = null;

  /** Returns false when the device has no pedometer. GPS is optional. */
  async start(): Promise<boolean> {
    if (!(await Pedometer.isAvailableAsync())) return false;

    this.startedAt = Date.now();
    this.steps = 0;
    this.stepUpdateIntervalsMs = [];
    this.lastStepUpdateAt = 0;
    this.gpsDistanceM = null;
    this.maxGpsJumpM = 0;
    this.lastFix = null;

    this.pedometerSub = Pedometer.watchStepCount(({ steps }) => {
      this.steps = steps;
      const now = Date.now();
      if (this.lastStepUpdateAt > 0) {
        this.stepUpdateIntervalsMs.push(now - this.lastStepUpdateAt);
      }
      this.lastStepUpdateAt = now;
    });

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      this.gpsDistanceM = 0;
      this.locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5_000,
          distanceInterval: 10,
        },
        (pos) => {
          const fix = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          if (this.lastFix) {
            const jump = haversineM(this.lastFix, fix);
            this.gpsDistanceM = (this.gpsDistanceM ?? 0) + jump;
            this.maxGpsJumpM = Math.max(this.maxGpsJumpM, jump);
          }
          this.lastFix = fix;
        }
      );
    }
    return true;
  }

  stop(): SessionTelemetry {
    this.pedometerSub?.remove();
    this.locationSub?.remove();
    this.pedometerSub = null;
    this.locationSub = null;
    return {
      steps: this.steps,
      durationSec: Math.max(1, Math.round((Date.now() - this.startedAt) / 1000)),
      gpsDistanceM: this.gpsDistanceM,
      maxGpsJumpM: Math.round(this.maxGpsJumpM),
      cadenceVariation: coefficientOfVariation(this.stepUpdateIntervalsMs),
    };
  }
}
