/**
 * Registry for subject-specific intent detectors.
 */

import { IntentDetector } from '../types';
import { IntentDetectorFn } from './types';

class IntentRegistry {
  private bySubject = new Map<string, IntentDetector[]>();

  register(subjectId: string, detector: IntentDetector): void {
    const existing = this.bySubject.get(subjectId) ?? [];
    this.bySubject.set(subjectId, [...existing, detector]);
  }

  registerAll(subjectId: string, detectors: IntentDetector[]): void {
    for (const detector of detectors) {
      this.register(subjectId, detector);
    }
  }

  getForSubject(subjectId: string): IntentDetector[] {
    return this.bySubject.get(subjectId) ?? [];
  }

  getAll(): IntentDetector[] {
    return Array.from(this.bySubject.values()).flat();
  }

  asDetectionFns(subjectId?: string): IntentDetectorFn[] {
    const detectors = subjectId ? this.getForSubject(subjectId) : this.getAll();
    return detectors.map((detector) => (input, context) => detector(input, context));
  }
}

export const intentRegistry = new IntentRegistry();
