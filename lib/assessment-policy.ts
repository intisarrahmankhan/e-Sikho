export const EDUCATION_LEVELS = ['SCHOOL', 'COLLEGE', 'UNIVERSITY'] as const;
export type EducationLevel = typeof EDUCATION_LEVELS[number];
export type AssessmentKind = 'EXAM' | 'CONTEST';
export interface AssessmentAudience { educationLevels: EducationLevel[]; departments: string[]; studentIds: string[] }
export interface AssessmentViewer { id: string; role?: string; educationLevel?: string; department?: string }
export const emptyAudience = (): AssessmentAudience => ({ educationLevels: [], departments: [], studentIds: [] });

export function normalizeDepartment(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalized.match(/\(([a-z_ ]+)\)$/)?.[1] || normalized;
}
export function validateAudience(input?: Partial<AssessmentAudience>): AssessmentAudience {
  if (!input) return emptyAudience();
  for (const key of ['educationLevels', 'departments', 'studentIds'] as const) {
    if (input[key] !== undefined && (!Array.isArray(input[key]) || input[key]!.some((value) => typeof value !== 'string'))) throw new Error('Invalid audience selection.');
  }
  const levels = [...new Set(input.educationLevels || [])];
  if (levels.some((level) => !EDUCATION_LEVELS.includes(level))) throw new Error('Choose school, college, or university.');
  const departments = [...new Set((input.departments || []).map(normalizeDepartment).filter(Boolean))];
  const studentIds = [...new Set((input.studentIds || []).map((id) => id.trim()))];
  if (departments.length > 30 || departments.some((value) => value.length > 100) || studentIds.length > 500 || studentIds.some((id) => !/^[a-f0-9]{24}$/i.test(id))) throw new Error('Invalid audience filters.');
  return { educationLevels: levels, departments, studentIds };
}
export function matchesAudience(input: Partial<AssessmentAudience> | undefined, viewer: AssessmentViewer | null) {
  if (!viewer?.id) return false;
  const audience = validateAudience(input);
  return (!audience.educationLevels.length || audience.educationLevels.includes(viewer.educationLevel as EducationLevel))
    && (!audience.departments.length || audience.departments.includes(normalizeDepartment(viewer.department || '')))
    && (!audience.studentIds.length || audience.studentIds.includes(viewer.id));
}
export function managesAssessment(record: any, viewer: AssessmentViewer | null) {
  return !!viewer && (['ADMIN', 'SUPERADMIN'].includes(viewer.role || '') || (viewer.role === 'INSTRUCTOR' && String(record.createdById) === viewer.id));
}
export function managesCourse(course: any, viewer: AssessmentViewer) {
  return ['ADMIN', 'SUPERADMIN'].includes(viewer.role || '') || (viewer.role === 'INSTRUCTOR' && (String(course.createdById) === viewer.id || (course.instructorUserIds || []).some((id: any) => String(id) === viewer.id)));
}
