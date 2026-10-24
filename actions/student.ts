'use server';

import {
  requestInstructorRole as _requestInstructorRole,
  enrollInCourseAction as _enrollInCourseAction,
  getStudentProfileAction as _getStudentProfileAction,
  updateStudentProfileAction as _updateStudentProfileAction,
  updateStudentPasswordAction as _updateStudentPasswordAction,
} from './student-actions';

export async function requestInstructorRole(formData: FormData) {
  return _requestInstructorRole(formData);
}

export async function enrollInCourseAction(courseId: string) {
  return _enrollInCourseAction(courseId);
}

export async function getStudentProfileAction() {
  return _getStudentProfileAction();
}

export async function updateStudentProfileAction(data: Parameters<typeof _updateStudentProfileAction>[0]) {
  return _updateStudentProfileAction(data);
}

export async function updateStudentPasswordAction(data: Parameters<typeof _updateStudentPasswordAction>[0]) {
  return _updateStudentPasswordAction(data);
}
