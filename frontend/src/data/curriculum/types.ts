export type EducationLevel = 'primary' | 'jss' | 'sss';

export type ClassId =
  | 'primary-1'
  | 'primary-2'
  | 'primary-3'
  | 'primary-4'
  | 'primary-5'
  | 'primary-6'
  | 'jss-1'
  | 'jss-2'
  | 'jss-3'
  | 'ss-1'
  | 'ss-2'
  | 'ss-3';

export interface CurriculumClass {
  id: ClassId;
  label: string;
  shortLabel: string;
  level: EducationLevel;
}

export interface CurriculumTopic {
  id: string;
  title: string;
  theme: string;
  /** Classes that cover this topic (supports multi-year themes). */
  classes: ClassId[];
  description?: string;
}

export interface CurriculumSubject {
  id: string;
  name: string;
  description: string;
  curriculum: string;
  available: boolean;
  topics: CurriculumTopic[];
}

export interface EducationLevelInfo {
  id: EducationLevel;
  label: string;
  description: string;
  classes: CurriculumClass[];
}
