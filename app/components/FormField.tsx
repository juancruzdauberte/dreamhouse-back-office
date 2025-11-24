"use client";
import React, { useState } from "react";
import DatePicker from "react-datepicker";

type BaseFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  className?: string;
};

type InputFieldProps = BaseFieldProps & {
  type: "text" | "email" | "date" | "number";
  placeholder?: string;
  defaultValue?: string | number;
  pattern?: string;
  maxLength?: number;
  title?: string;
  disablePastDates?: boolean;
  disabledRanges?: { start: Date | string; end: Date | string }[];
};

type SelectFieldProps = BaseFieldProps & {
  type: "select";
  options: Array<{ value: string | number | undefined; label: string }>;
  defaultValue?: string | number;
  placeholder?: string;
};

type FieldsetProps = {
  legend: string;
  children: React.ReactNode;
  className?: string;
};

type FormFieldProps = InputFieldProps | SelectFieldProps;

export function FormField(props: FormFieldProps) {
  const [dateValue, setDateValue] = useState<Date | null>(
    props.type === "date" && props.defaultValue
      ? new Date(props.defaultValue)
      : null
  );

  const baseClasses =
    "w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-200 hover:border-gray-400";

  const labelClasses = "block text-xs font-medium text-gray-700 mb-1";

  if (props.type === "select") {
    return (
      <div className={`flex flex-col ${props.className || ""}`}>
        <label htmlFor={props.name} className={labelClasses}>
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          id={props.name}
          name={props.name}
          required={props.required}
          defaultValue={props.defaultValue}
          className={`${baseClasses} cursor-pointer bg-white`}
        >
          {props.placeholder && (
            <option value="" disabled>
              {props.placeholder}
            </option>
          )}
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (props.type === "date") {
    const excludeIntervals = props.disabledRanges?.map((range) => ({
      start: new Date(range.start),
      end: new Date(range.end),
    }));

    return (
      <div className={`flex flex-col ${props.className || ""}`}>
        <label htmlFor={props.name} className={labelClasses}>
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <DatePicker
          selected={dateValue}
          onChange={(date) => setDateValue(date)}
          name={props.name}
          dateFormat="yyyy-MM-dd"
          className={baseClasses}
          placeholderText={props.placeholder || "Seleccionar fecha"}
          excludeDateIntervals={excludeIntervals}
          required={props.required}
          minDate={props.disablePastDates ? new Date() : undefined}
          autoComplete="off"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${props.className || ""}`}>
      <label htmlFor={props.name} className={labelClasses}>
        {props.label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={props.name}
        type={props.type}
        name={props.name}
        required={props.required}
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        pattern={props.pattern}
        maxLength={props.maxLength}
        title={props.title}
        className={baseClasses}
      />
    </div>
  );
}

export function FormFieldset({ legend, children, className }: FieldsetProps) {
  return (
    <fieldset
      className={`rounded-lg border border-gray-200 p-4 bg-gray-50/30 ${
        className || ""
      }`}
    >
      <legend className="px-2 text-sm font-semibold text-indigo-800">
        {legend}
      </legend>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </fieldset>
  );
}
