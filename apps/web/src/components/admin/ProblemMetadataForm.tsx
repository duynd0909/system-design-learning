'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const CATEGORY_SUGGESTIONS = [
  'Social Media', 'Video Streaming', 'Messaging', 'Real-Time Communication',
  'Marketplace', 'E-Commerce', 'Financial Services', 'Search',
];

export interface ProblemMetadata {
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
}

interface ProblemMetadataFormProps {
  initialValues?: Partial<ProblemMetadata>;
  onSubmit: (data: ProblemMetadata) => void;
  isLoading?: boolean;
  submitLabel?: string;
  disableSlug?: boolean;
  formId?: string;
  hideSubmit?: boolean;
}

function validateSlug(slug: string) {
  if (!slug.trim()) return 'Slug is required';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return 'Slug must be lowercase letters, numbers, and hyphens only';
  return '';
}

export function ProblemMetadataForm({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel = 'Save',
  disableSlug = false,
  formId,
  hideSubmit = false,
}: ProblemMetadataFormProps) {
  const [values, setValues] = useState<ProblemMetadata>({
    slug: initialValues?.slug ?? '',
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    difficulty: initialValues?.difficulty ?? 'MEDIUM',
    category: initialValues?.category ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProblemMetadata, string>>>({});

  const set = (field: keyof ProblemMetadata) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((err) => ({ ...err, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    const slugError = validateSlug(values.slug);
    if (slugError) newErrors.slug = slugError;
    if (!values.title.trim()) newErrors.title = 'Title is required';
    if (!values.description.trim()) newErrors.description = 'Description is required';
    if (!values.category.trim()) newErrors.category = 'Category is required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    onSubmit(values);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Slug"
        placeholder="e.g. design-twitter"
        value={values.slug}
        onChange={set('slug')}
        error={errors.slug}
        disabled={disableSlug || isLoading}
        autoComplete="off"
      />
      <Input
        label="Title"
        placeholder="e.g. Design Twitter/X"
        value={values.title}
        onChange={set('title')}
        error={errors.title}
        disabled={isLoading}
      />
      <Textarea
        label="Description"
        placeholder="What does the player need to design? (shown on problem card)"
        value={values.description}
        onChange={set('description')}
        error={errors.description}
        disabled={isLoading}
        rows={3}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Difficulty"
          value={values.difficulty}
          onChange={set('difficulty')}
          options={DIFFICULTY_OPTIONS}
          disabled={isLoading}
        />
        <div className="w-full">
          <Input
            label="Category"
            placeholder="e.g. Social Media"
            value={values.category}
            onChange={set('category')}
            error={errors.category}
            disabled={isLoading}
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>
      {!hideSubmit && (
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
            {isLoading ? 'Saving…' : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
