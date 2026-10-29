/**
 * Subject and topic registry.
 * Core engines discover capabilities here — no topic logic in core/.
 */

import { SubjectRegistration, TopicRegistration } from '../types';
import { mathSubject } from './math';
import { englishSubject } from './english';

class SubjectRegistry {
  private subjects = new Map<string, SubjectRegistration>();

  register(subject: SubjectRegistration): void {
    this.subjects.set(subject.id, subject);
  }

  get(subjectId: string): SubjectRegistration | undefined {
    return this.subjects.get(subjectId);
  }

  getTopic(subjectId: string, topicId: string): TopicRegistration | undefined {
    return this.subjects.get(subjectId)?.topics.find((t) => t.id === topicId);
  }

  getAll(): SubjectRegistration[] {
    return Array.from(this.subjects.values());
  }
}

export const subjectRegistry = new SubjectRegistry();

export function registerBuiltinSubjects(): void {
  subjectRegistry.register(mathSubject);
  subjectRegistry.register(englishSubject);
}

registerBuiltinSubjects();
