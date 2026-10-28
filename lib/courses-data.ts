export interface Lesson {
  id: string;
  title: string;
  titleEn?: string;
  duration: string;
  durationEn?: string;
  isFree?: boolean;
  videoUrl?: string;
}

export interface Module {
  id: string;
  title: string;
  titleEn?: string;
  duration: string;
  durationEn?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  titleEn?: string;
  tagline: string;
  taglineEn?: string;
  description: string;
  descriptionEn?: string;
  category: 'web-dev' | 'data-science' | 'app-dev' | 'programming' | 'system-design';
  categoryBangla: string;
  categoryEn?: string;
  level: 'বিগিনার' | 'ইন্টারমিডিয়েট' | 'অ্যাডভান্সড';
  levelEn?: string;
  rating: number;
  totalRatings: number;
  studentsEnrolled: number;
  duration: string;
  durationEn?: string;
  totalLessons: number;
  price: number;
  originalPrice: number;
  thumbnailUrl: string;
  thumbnailUrlEn?: string;
  previewVideoUrl?: string;
  instructor: {
    name: string;
    nameEn?: string;
    role: string;
    roleEn?: string;
    avatar: string;
    bio: string;
    bioEn?: string;
  };
  learningOutcomes: string[];
  learningOutcomesEn?: string[];
  prerequisites: string[];
  prerequisitesEn?: string[];
  modules: Module[];
}

// Course content is loaded from MongoDB; no sample courses are shipped.
export const COURSES_DATA: Course[] = [];

export function getAllCourses(): Course[] {
  return COURSES_DATA;
}

export function getCourseById(id: string): Course | undefined {
  return COURSES_DATA.find((course) => course.id === id);
}
