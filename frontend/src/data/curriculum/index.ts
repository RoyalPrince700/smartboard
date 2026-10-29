import { mathematicsSubject } from './mathematics';
import type {
  ClassId,
  CurriculumClass,
  CurriculumSubject,
  EducationLevel,
  EducationLevelInfo,
} from './types';

export type {
  ClassId,
  CurriculumClass,
  CurriculumSubject,
  CurriculumTopic,
  EducationLevel,
  EducationLevelInfo,
} from './types';

export { getTopicsForClass, groupTopicsByTheme, mathematicsSubject } from './mathematics';

export const EDUCATION_LEVELS: EducationLevelInfo[] = [
  {
    id: 'primary',
    label: 'Primary',
    description: 'Primary 1 – 6 · Basic numeracy foundation',
    classes: [
      { id: 'primary-1', label: 'Primary 1', shortLabel: 'Pry 1', level: 'primary' },
      { id: 'primary-2', label: 'Primary 2', shortLabel: 'Pry 2', level: 'primary' },
      { id: 'primary-3', label: 'Primary 3', shortLabel: 'Pry 3', level: 'primary' },
      { id: 'primary-4', label: 'Primary 4', shortLabel: 'Pry 4', level: 'primary' },
      { id: 'primary-5', label: 'Primary 5', shortLabel: 'Pry 5', level: 'primary' },
      { id: 'primary-6', label: 'Primary 6', shortLabel: 'Pry 6', level: 'primary' },
    ],
  },
  {
    id: 'jss',
    label: 'Junior Secondary',
    description: 'JSS 1 – 3 · Basic Education Certificate',
    classes: [
      { id: 'jss-1', label: 'JSS 1', shortLabel: 'JSS 1', level: 'jss' },
      { id: 'jss-2', label: 'JSS 2', shortLabel: 'JSS 2', level: 'jss' },
      { id: 'jss-3', label: 'JSS 3', shortLabel: 'JSS 3', level: 'jss' },
    ],
  },
  {
    id: 'sss',
    label: 'Senior Secondary',
    description: 'SS 1 – 3 · WAEC / NECO pathway',
    classes: [
      { id: 'ss-1', label: 'SS 1', shortLabel: 'SS 1', level: 'sss' },
      { id: 'ss-2', label: 'SS 2', shortLabel: 'SS 2', level: 'sss' },
      { id: 'ss-3', label: 'SS 3', shortLabel: 'SS 3', level: 'sss' },
    ],
  },
];

/** Subjects shown on the home page. Mathematics is live; others are placeholders. */
export const CURRICULUM_SUBJECTS: CurriculumSubject[] = [
  mathematicsSubject,
  {
    id: 'english',
    name: 'English Language',
    description: 'Reading, writing, grammar, and oral English across all levels.',
    curriculum: 'NERDC (Nigeria)',
    available: false,
    topics: [],
  },
  {
    id: 'basic-science',
    name: 'Basic Science',
    description: 'Integrated science for Primary and Junior Secondary.',
    curriculum: 'NERDC (Nigeria)',
    available: false,
    topics: [],
  },
  {
    id: 'physics',
    name: 'Physics',
    description: 'Senior Secondary Physics — mechanics, waves, electricity, and more.',
    curriculum: 'NERDC (Nigeria)',
    available: false,
    topics: [],
  },
];

export function findClass(classId: ClassId): CurriculumClass | undefined {
  for (const level of EDUCATION_LEVELS) {
    const match = level.classes.find((c) => c.id === classId);
    if (match) return match;
  }
  return undefined;
}

export function findLevel(levelId: EducationLevel): EducationLevelInfo | undefined {
  return EDUCATION_LEVELS.find((l) => l.id === levelId);
}

export function classShortLabel(classId: ClassId): string {
  return findClass(classId)?.shortLabel ?? classId;
}

export function formatSpanClasses(classIds: ClassId[], current: ClassId): string | null {
  const others = classIds.filter((id) => id !== current);
  if (others.length === 0) return null;
  return `Also in ${others.map(classShortLabel).join(', ')}`;
}
