'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCourse } from '@/actions/instructor';
import { PlusCircle, Loader2, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';

interface CourseFormProps {
  onSuccess?: () => void;
}

const controlClassName =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

const textareaClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

export default function CourseForm({ onSuccess }: CourseFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage('');
    const result = await createCourse(formData);
    if (result.error) {
      setIsError(true);
      setMessage(result.error);
      setPending(false);
    } else {
      setIsError(false);
      const newId = result.courseId;
      setCreatedCourseId(newId || null);
      setMessage('Course created successfully! Redirecting to curriculum builder...');
      formRef.current?.reset();
      onSuccess?.();
      if (newId && router) {
        setTimeout(() => {
          router?.push?.(`/instructor/courses/${newId}/lectures`);
        }, 800);
      }
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        submit(formData);
      }}
      encType="multipart/form-data"
      className="space-y-6"
    >
      <FieldSet className="grid gap-5 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="title">Course Title (Primary / Bangla) *</FieldLabel>
          <input id="title" name="title" required placeholder="যেমন: ফুলস্ট্যাক রিঅ্যাক্ট ও নেক্সট জেএস" className={controlClassName} />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="titleEn">Course Title in English (Optional)</FieldLabel>
          <input id="titleEn" name="titleEn" placeholder="e.g. Complete React & Next.js Bootcamp" className={controlClassName} />
          <FieldDescription>If provided, will show when users toggle language to English.</FieldDescription>
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="tagline">Short Tagline (Bangla)</FieldLabel>
          <input id="tagline" name="tagline" placeholder="এক লাইনে কোর্সের পরিচিতি" className={controlClassName} />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="taglineEn">Short Tagline in English (Optional)</FieldLabel>
          <input id="taglineEn" name="taglineEn" placeholder="One-line course description in English" className={controlClassName} />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="description">Description (Bangla / Primary) *</FieldLabel>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            placeholder="কোর্সের বিস্তারিত বিবরণ..."
            className={textareaClassName}
          />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="descriptionEn">Description in English (Optional)</FieldLabel>
          <textarea
            id="descriptionEn"
            name="descriptionEn"
            rows={4}
            placeholder="Detailed course description in English..."
            className={textareaClassName}
          />
          <FieldDescription>If provided, will show when users toggle to English.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="category">Category *</FieldLabel>
          <input id="category" name="category" required placeholder="e.g. Web Development" className={controlClassName} />
        </Field>

        <Field>
          <FieldLabel htmlFor="level">Level</FieldLabel>
          <select id="level" name="level" className={controlClassName}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor="duration">Duration</FieldLabel>
          <input id="duration" name="duration" placeholder="e.g. 12 hours" className={controlClassName} />
        </Field>

        <Field>
          <FieldLabel htmlFor="price">Price (BDT) - 0 for free</FieldLabel>
          <input id="price" name="price" type="number" min="0" defaultValue="0" required className={controlClassName} />
          <FieldDescription>Set the price in Bangladeshi taka.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="thumbnail">Course Thumbnail (Primary / Bangla)</FieldLabel>
          <input
            id="thumbnail"
            name="thumbnail"
            type="file"
            accept="image/*"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
          />
          <FieldDescription>Displayed in Bangla view (16:9 aspect ratio).</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="thumbnailEn">English Thumbnail (Optional)</FieldLabel>
          <input
            id="thumbnailEn"
            name="thumbnailEn"
            type="file"
            accept="image/*"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
          />
          <FieldDescription>Shown when user toggles to English view.</FieldDescription>
        </Field>

        <FieldSet className="sm:col-span-2 space-y-4 border-t border-slate-100 pt-5">
          <FieldLegend variant="label">First Module & Lesson</FieldLegend>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="moduleTitle">Module Title *</FieldLabel>
              <input id="moduleTitle" name="moduleTitle" required placeholder="Module title" className={controlClassName} />
            </Field>
            <Field>
              <FieldLabel htmlFor="lessonTitle">First Lesson Title *</FieldLabel>
              <input id="lessonTitle" name="lessonTitle" required placeholder="First lesson title" className={controlClassName} />
            </Field>
          </FieldGroup>
          <Field>
            <FieldLabel htmlFor="lessonContent">Lesson Content *</FieldLabel>
            <textarea
              id="lessonContent"
              name="lessonContent"
              required
              rows={5}
              placeholder="Lesson content..."
              className={textareaClassName}
            />
          </Field>
        </FieldSet>
      </FieldSet>

      <Button
        type="submit"
        disabled={pending}
        size="lg"
        className="h-11 w-full rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        {pending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
        ) : (
          <><PlusCircle className="h-4 w-4" /> Submit Course for Review</>
        )}
      </Button>

      {message && (
        isError ? (
          <FieldError className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{message}</FieldError>
        ) : (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 text-sm font-semibold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
            {createdCourseId && (
              <div className="pt-1">
                <Link
                  href={`/instructor/courses/${createdCourseId}/lectures`}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  <Layers className="h-4 w-4" />
                  <span>এখনই কারিকুলাম ও লেকচার সাজান (Curriculum Builder)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        )
      )}
    </form>
  );
}
