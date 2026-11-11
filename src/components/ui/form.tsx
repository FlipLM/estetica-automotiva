"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  rightLabel?: React.ReactNode;
}

export function FormField({
  label,
  description,
  error,
  required,
  htmlFor,
  children,
  className,
  rightLabel,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || rightLabel) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <label
              htmlFor={htmlFor}
              className="block text-[13px] font-medium text-[#252B27]"
            >
              {label}
              {required && <span className="text-[#DC4C4C] ml-0.5">*</span>}
            </label>
          )}
          {rightLabel && <div>{rightLabel}</div>}
        </div>
      )}
      {children}
      {description && !error && (
        <p className="text-[12px] text-[#737D75]">{description}</p>
      )}
      {error && (
        <p className="text-[12px] font-medium text-[#DC4C4C]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 pt-4 first:pt-0", className)}>
      <div className="border-b border-[#E7EAE7] pb-2.5">
        <h4 className="text-[15px] font-semibold text-[#252B27]">{title}</h4>
        {description && (
          <p className="text-[13px] text-[#737D75] mt-0.5">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  rightLabel?: React.ReactNode;
  description?: string;
  hint?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      rightLabel,
      description,
      hint,
      error,
      leftIcon,
      rightElement,
      required,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const effectiveDescription = description || hint;
    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737D75] pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          required={required}
          className={cn(
            "w-full h-10 bg-white border border-[#E7EAE7] rounded-[8px] px-3 text-[14px] text-[#252B27] placeholder:text-[#9CA49E] transition-all duration-150",
            "hover:border-[#D5DBD5] focus:outline-none focus:border-[#247653] focus:ring-3 focus:ring-[#247653]/12",
            "disabled:bg-[#F1F3F1] disabled:text-[#737D75] disabled:cursor-not-allowed",
            leftIcon && "pl-9",
            rightElement && "pr-9",
            error && "border-[#DC4C4C] focus:border-[#DC4C4C] focus:ring-[#DC4C4C]/12",
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    );

    if (label || rightLabel || effectiveDescription || error) {
      return (
        <FormField
          label={label}
          rightLabel={rightLabel}
          description={effectiveDescription}
          error={error}
          required={required}
          htmlFor={id}
        >
          {inputElement}
        </FormField>
      );
    }

    return inputElement;
  }
);
Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string | null;
  options?: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, description, error, required, className, id, options, children, ...props }, ref) => {
    const selectElement = (
      <select
        ref={ref}
        id={id}
        required={required}
        className={cn(
          "w-full h-10 bg-white border border-[#E7EAE7] rounded-[8px] px-3 text-[14px] text-[#252B27] transition-all duration-150",
          "hover:border-[#D5DBD5] focus:outline-none focus:border-[#247653] focus:ring-3 focus:ring-[#247653]/12",
          "disabled:bg-[#F1F3F1] disabled:text-[#737D75] disabled:cursor-not-allowed",
          error && "border-[#DC4C4C] focus:border-[#DC4C4C]",
          className
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );

    if (label || description || error) {
      return (
        <FormField
          label={label}
          description={description}
          error={error}
          required={required}
          htmlFor={id}
        >
          {selectElement}
        </FormField>
      );
    }

    return selectElement;
  }
);
Select.displayName = "Select";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string | null;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, description, error, required, className, id, ...props }, ref) => {
    const el = (
      <textarea
        ref={ref}
        id={id}
        required={required}
        className={cn(
          "w-full min-h-[88px] bg-white border border-[#E7EAE7] rounded-[8px] p-3 text-[14px] text-[#252B27] placeholder:text-[#9CA49E] transition-all duration-150",
          "hover:border-[#D5DBD5] focus:outline-none focus:border-[#247653] focus:ring-3 focus:ring-[#247653]/12",
          "disabled:bg-[#F1F3F1] disabled:text-[#737D75] disabled:cursor-not-allowed",
          error && "border-[#DC4C4C]",
          className
        )}
        {...props}
      />
    );

    if (label || description || error) {
      return (
        <FormField
          label={label}
          description={description}
          error={error}
          required={required}
          htmlFor={id}
        >
          {el}
        </FormField>
      );
    }

    return el;
  }
);
Textarea.displayName = "Textarea";

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
  onClear,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="w-4 h-4 text-[#737D75] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 bg-white border border-[#E7EAE7] rounded-[8px] pl-9 pr-8 text-[14px] text-[#252B27] placeholder:text-[#9CA49E] hover:border-[#D5DBD5] focus:outline-none focus:border-[#247653] focus:ring-3 focus:ring-[#247653]/12 transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          aria-label="Limpar busca"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA49E] hover:text-[#252B27] p-0.5 rounded cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2.5 cursor-pointer select-none",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded-[4px] border border-[#D5DBD5] text-[#247653] accent-[#247653] focus:ring-2 focus:ring-[#247653]/25 cursor-pointer"
      />
      <div>
        <span className="text-[14px] font-medium text-[#252B27] leading-snug block">
          {label}
        </span>
        {description && (
          <span className="text-[12px] text-[#737D75] block mt-0.5">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-center justify-between gap-3 cursor-pointer select-none",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {(label || description) && (
        <div>
          {label && (
            <span className="text-[14px] font-medium text-[#252B27] block">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[12px] text-[#737D75] block">{description}</span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#247653]/30 cursor-pointer",
          checked ? "bg-[#247653]" : "bg-[#D5DBD5]"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </label>
  );
}
