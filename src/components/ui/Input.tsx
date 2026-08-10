import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  forwardRef,
  useId,
} from "react";

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { as?: "input" };

type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: "textarea" };

type SelectProps = BaseProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    as: "select";
    options: { value: string; label: string }[];
  };

function fieldClass(error?: string) {
  return `mt-1 block w-full rounded-md border px-3 py-2 shadow-sm
    focus:outline-none focus:ring-1
    ${
      error
        ? "border-danger focus:border-danger focus:ring-danger"
        : "border-gray-300 focus:border-brand focus:ring-brand"
    }`;
}

export const Input = forwardRef<HTMLInputElement, Omit<InputProps, "as">>(
  ({ label, error, hint, className = "", id: providedId, ...props }, ref) => {
    const autoId = useId();
    const id = providedId ?? autoId;
    return (
      <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <input ref={ref} id={id} className={fieldClass(error)} {...props} />
        {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-danger-text">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, Omit<TextareaProps, "as">>(
  ({ label, error, hint, className = "", id: providedId, ...props }, ref) => {
    const autoId = useId();
    const id = providedId ?? autoId;
    return (
      <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <textarea ref={ref} id={id} className={fieldClass(error)} {...props} />
        {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-danger-text">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, Omit<SelectProps, "as">>(
  ({ label, error, hint, options, className = "", id: providedId, ...props }, ref) => {
    const autoId = useId();
    const id = providedId ?? autoId;
    return (
      <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <select ref={ref} id={id} className={fieldClass(error)} {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-danger-text">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
