import { useCallback, useRef, useState, type FormEvent } from "react";

export type ValidationRule =
  | { type: "required"; message?: string }
  | { type: "minLength"; value: number; message?: string }
  | { type: "maxLength"; value: number; message?: string }
  | { type: "pattern"; value: RegExp; message?: string }
  | { type: "custom"; validate: (value: string) => string | null }
  | { type: "email"; message?: string };

type ValidationSchema<T extends string> = Partial<Record<T, ValidationRule[]>>;

interface FieldProps {
  name: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  onBlur: (e: { target: { name: string } }) => void;
}

interface UseFormReturn<T extends Record<string, string>> {
  register: (name: keyof T & string) => FieldProps;
  errors: Partial<Record<keyof T & string, string>>;
  handleSubmit: (
    onSubmit: (data: T) => Promise<void> | void
  ) => (e: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  reset: () => void;
  setFieldValue: (name: keyof T & string, value: string) => void;
  getFieldError: (name: keyof T & string) => string | undefined;
}

const defaultMessages: Record<string, string> = {
  required: "This field is required",
  minLength: "Too short",
  maxLength: "Too long",
  pattern: "Invalid format",
  email: "Invalid email address",
};

export function useForm<T extends Record<string, string>>(
  schema: ValidationSchema<string>
): UseFormReturn<T> {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const validateField = useCallback(
    (name: string, value: string): string | undefined => {
      const rules = schema[name];
      if (!rules) return undefined;

      for (const rule of rules) {
        switch (rule.type) {
          case "required":
            if (!value.trim()) return rule.message ?? defaultMessages.required;
            break;
          case "minLength":
            if (value.length < rule.value)
              return rule.message ?? `${defaultMessages.minLength} (min ${rule.value})`;
            break;
          case "maxLength":
            if (value.length > rule.value)
              return rule.message ?? `${defaultMessages.maxLength} (max ${rule.value})`;
            break;
          case "pattern":
            if (value && !rule.value.test(value)) return rule.message ?? defaultMessages.pattern;
            break;
          case "email":
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
              return rule.message ?? defaultMessages.email;
            break;
          case "custom": {
            const customError = rule.validate(value);
            if (customError) return customError;
            break;
          }
        }
      }
      return undefined;
    },
    [schema]
  );

  const setFieldError = useCallback((name: string, error: string | undefined) => {
    setErrors((prev) => {
      if (!error) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: error };
    });
  }, []);

  const register = useCallback(
    (name: string): FieldProps => ({
      name,
      onChange: (e) => {
        const currentError = errors[name];
        if (currentError) {
          const err = validateField(name, e.target.value);
          if (err !== currentError) setFieldError(name, err);
        }
      },
      onBlur: (e) => {
        const input = e.target as unknown as HTMLInputElement | undefined;
        const value = input?.value ?? "";
        const err = validateField(name, value);
        setFieldError(name, err);
      },
    }),
    [errors, validateField, setFieldError]
  );

  const handleSubmit = useCallback(
    (onSubmit: (data: T) => Promise<void> | void) => (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      formRef.current = form;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries()) as T;

      let hasErrors = false;
      const newErrors: Record<string, string> = {};

      for (const key of Object.keys(schema)) {
        const value = (formData.get(key) as string) ?? "";
        const err = validateField(key, value);
        if (err) {
          newErrors[key] = err;
          hasErrors = true;
        }
      }

      setErrors(newErrors);

      if (!hasErrors) {
        setIsSubmitting(true);
        Promise.resolve(onSubmit(data)).finally(() => setIsSubmitting(false));
      }
    },
    [schema, validateField]
  );

  const reset = useCallback(() => {
    setErrors({});
    formRef.current?.reset();
  }, []);

  const setFieldValue = useCallback((name: string, value: string) => {
    const input = formRef.current?.querySelector(`[name="${name}"]`) as HTMLInputElement | null;
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeSetter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, []);

  const getFieldError = useCallback((name: string) => errors[name], [errors]);

  return { register, errors, handleSubmit, isSubmitting, reset, setFieldValue, getFieldError };
}
