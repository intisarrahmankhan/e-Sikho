'use client';

import { useRef, useState } from 'react';
import { createCourse } from '@/actions/instructor';
import { PlusCircle, Loader2 } from 'lucide-react';
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
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage('');
    const result = await createCourse(formData);
    if (result.error) {
      setIsError(true);
      setMessage(result.error);
    } else {
      setIsError(false);
      setMessage('Course submitted for admin review!');
      formRef.current?.reset();
      onSuccess?.();
    }
    setPending(false);
  }

  return (
    <form ref={formRef} action={submit} encType="multipart/form-data" className="space-y-6">
      <FieldSet className="grid gap-5 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="title">Course Title *</FieldLabel>
          <input id="title" name="title" required placeholder="e.g. Complete React Course" className={controlClassName} />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="tagline">Short Tagline</FieldLabel>
          <input id="tagline" name="tagline" placeholder="One-line course description" className={controlClassName} />
          <FieldDescription>Give learners a concise reason to choose this course.</FieldDescription>
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="description">Description *</FieldLabel>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            placeholder="Detailed course description..."
            className={textareaClassName}
          />
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

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="thumbnail">Course Thumbnail</FieldLabel>
          <input
            id="thumbnail"
            name="thumbnail"
            type="file"
            accept="image/*"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-indigo-700"
          />
          <FieldDescription>Use a clear 16:9 image to represent your course.</FieldDescription>
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
          <FieldDescription className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">{message}</FieldDescription>
        )
      )}
    </form>
  );
}
