import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/shared/firebase/client';

export type TelemetryLevel = 'info' | 'warn' | 'error';

export interface TelemetryEvent {
  eventName: string;
  level?: TelemetryLevel;
  route?: string;
  message?: string;
  payload?: Record<string, unknown>;
}

export async function logTelemetry(event: TelemetryEvent): Promise<void> {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'client_telemetry'), {
      eventName: event.eventName,
      level: event.level ?? 'info',
      route: event.route ?? null,
      message: event.message ?? null,
      payload: event.payload ?? null,
      userId: user?.uid ?? null,
      appVersion: import.meta.env.VITE_APP_VERSION ?? 'web-dev',
      createdAt: serverTimestamp(),
    });
  } catch {
    return;
  }
}
