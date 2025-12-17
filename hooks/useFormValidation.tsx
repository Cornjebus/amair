'use client';

import * as React from 'react';
import { z } from 'zod';

// =============================================================================
// Types
// =============================================================================

export interface FieldError {
  message: string;
  path: string[];
}

export interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface UseFormValidationOptions<T extends z.ZodObject<z.ZodRawShape>> {
  schema: T;
  initialValues: z.infer<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: z.infer<T>) => void | Promise<void>;
}

export interface UseFormValidationReturn<T extends z.ZodObject<z.ZodRawShape>> {
  values: z.infer<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  setFieldValue: (field: keyof z.infer<T>, value: unknown) => void;
  setFieldTouched: (field: keyof z.infer<T>, touched?: boolean) => void;
  setFieldError: (field: keyof z.infer<T>, error: string) => void;
  clearFieldError: (field: keyof z.infer<T>) => void;
  validateField: (field: keyof z.infer<T>) => string | undefined;
  validateForm: () => boolean;
  handleChange: (field: keyof z.infer<T>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof z.infer<T>) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (newValues?: z.infer<T>) => void;
  getFieldProps: (field: keyof z.infer<T>) => {
    value: unknown;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    'aria-invalid': boolean;
    'aria-describedby': string;
  };
  getFieldError: (field: keyof z.infer<T>) => string | undefined;
  hasFieldError: (field: keyof z.infer<T>) => boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useFormValidation<T extends z.ZodObject<z.ZodRawShape>>({
  schema,
  initialValues,
  validateOnChange = true,
  validateOnBlur = true,
  onSubmit,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  type FormValues = z.infer<T>;

  const [values, setValues] = React.useState<FormValues>(initialValues);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const initialValuesRef = React.useRef(initialValues);

  // Calculate derived states
  const isValid = React.useMemo(() => {
    const result = schema.safeParse(values);
    return result.success;
  }, [schema, values]);

  const isDirty = React.useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  // Validate a single field
  const validateField = React.useCallback(
    (field: keyof FormValues): string | undefined => {
      const fieldSchema = schema.shape[field as string];
      if (!fieldSchema) return undefined;

      const result = fieldSchema.safeParse(values[field]);
      if (!result.success) {
        return result.error.errors[0]?.message;
      }
      return undefined;
    },
    [schema, values]
  );

  // Validate entire form
  const validateForm = React.useCallback((): boolean => {
    const result = schema.safeParse(values);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!newErrors[path]) {
          newErrors[path] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [schema, values]);

  // Set field value
  const setFieldValue = React.useCallback(
    (field: keyof FormValues, value: unknown) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      if (validateOnChange) {
        // Clear error if value becomes valid
        const fieldSchema = schema.shape[field as string];
        if (fieldSchema) {
          const result = fieldSchema.safeParse(value);
          if (result.success) {
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[field as string];
              return newErrors;
            });
          }
        }
      }
    },
    [schema, validateOnChange]
  );

  // Set field touched
  const setFieldTouched = React.useCallback(
    (field: keyof FormValues, isTouched: boolean = true) => {
      setTouched((prev) => ({ ...prev, [field]: isTouched }));
    },
    []
  );

  // Set field error
  const setFieldError = React.useCallback(
    (field: keyof FormValues, error: string) => {
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    []
  );

  // Clear field error
  const clearFieldError = React.useCallback((field: keyof FormValues) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  // Handle change
  const handleChange = React.useCallback(
    (field: keyof FormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
        setFieldValue(field, value);
      },
    [setFieldValue]
  );

  // Handle blur
  const handleBlur = React.useCallback(
    (field: keyof FormValues) => () => {
      setFieldTouched(field, true);
      if (validateOnBlur) {
        const error = validateField(field);
        if (error) {
          setFieldError(field, error);
        } else {
          clearFieldError(field);
        }
      }
    },
    [setFieldTouched, validateOnBlur, validateField, setFieldError, clearFieldError]
  );

  // Handle submit
  const handleSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      Object.keys(schema.shape).forEach((key) => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // Validate form
      const isFormValid = validateForm();
      if (!isFormValid) {
        return;
      }

      // Submit
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [schema, validateForm, onSubmit, values]
  );

  // Reset form
  const reset = React.useCallback(
    (newValues?: FormValues) => {
      const resetValues = newValues ?? initialValuesRef.current;
      setValues(resetValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      if (newValues) {
        initialValuesRef.current = newValues;
      }
    },
    []
  );

  // Get field props helper
  const getFieldProps = React.useCallback(
    (field: keyof FormValues) => ({
      value: values[field] as unknown,
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      'aria-invalid': !!errors[field as string] && touched[field as string],
      'aria-describedby': `${String(field)}-error`,
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  // Get field error (only if touched)
  const getFieldError = React.useCallback(
    (field: keyof FormValues): string | undefined => {
      return touched[field as string] ? errors[field as string] : undefined;
    },
    [errors, touched]
  );

  // Check if field has error
  const hasFieldError = React.useCallback(
    (field: keyof FormValues): boolean => {
      return !!(touched[field as string] && errors[field as string]);
    },
    [errors, touched]
  );

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    validateField,
    validateForm,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldProps,
    getFieldError,
    hasFieldError,
  };
}

// =============================================================================
// FormField Component
// =============================================================================

export interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  name,
  error,
  required,
  description,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-amari-charcoal mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {description && !error && (
        <p className="mt-1.5 text-sm text-amari-muted">{description}</p>
      )}
      {error && (
        <p
          id={`${name}-error`}
          className="mt-1.5 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Inline validation error component
// =============================================================================

export interface InlineErrorProps {
  error?: string;
  id?: string;
  className?: string;
}

export function InlineError({ error, id, className }: InlineErrorProps) {
  if (!error) return null;

  return (
    <p
      id={id}
      className={`text-sm text-red-600 mt-1 ${className}`}
      role="alert"
    >
      {error}
    </p>
  );
}
