"use client";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { parsePhoneNumber } from "libphonenumber-js";

type BaseFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  className?: string;
};

type InputFieldProps = BaseFieldProps & {
  type: "text" | "email" | "date" | "number" | "phone" | "checkbox";
  placeholder?: string;
  defaultValue?: string | number | boolean;
  pattern?: string;
  maxLength?: number;
  title?: string;
  disablePastDates?: boolean;
  disabledRanges?: { start: Date | string; end: Date | string }[];
  defaultCountry?: any; // strict typing for Country can be imported if needed
  defaultChecked?: boolean;
};

type SelectFieldProps = BaseFieldProps & {
  type: "select";
  options: Array<{ value: string | number | undefined; label: string }>;
  defaultValue?: string | number;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

type FieldsetProps = {
  legend: string;
  children: React.ReactNode;
  className?: string;
};

type FormFieldProps = InputFieldProps | SelectFieldProps;

export function FormField(props: FormFieldProps) {
  const [dateValue, setDateValue] = useState<Date | null>(() => {
    if (props.type === "date" && props.defaultValue) {
      if (typeof props.defaultValue === "string") {
        // Parse "YYYY-MM-DD" as local date to avoid timezone shift
        const [year, month, day] = props.defaultValue.split("-").map(Number);
        return new Date(year, month - 1, day);
      }
      if (typeof props.defaultValue === "number") {
        return new Date(props.defaultValue);
      }
    }
    return null;
  });

  const [phoneValue, setPhoneValue] = useState<string | undefined>(() => {
    if (props.type === "phone" && props.defaultValue) {
      const val = String(props.defaultValue);
      if (val.startsWith("+")) {
        return val;
      }
      // Try to parse legacy/local format
      if (props.defaultCountry) {
        try {
          const phoneNumber = parsePhoneNumber(val, props.defaultCountry);
          if (phoneNumber && phoneNumber.isValid()) {
            return phoneNumber.number as string;
          }
        } catch (error) {
          console.warn("Failed to parse phone number:", val, error);
        }
      }
      return val; // Return original if parsing fails (might still error in PhoneInput but better than nothing)
    }
    return undefined;
  });

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
          onChange={props.onChange}
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

  if (props.type === "phone") {
    return (
      <div className={`flex flex-col ${props.className || ""}`}>
        <label htmlFor={props.name} className={labelClasses}>
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="phone-input-container">
          <PhoneInput
            placeholder={props.placeholder}
            value={phoneValue}
            onChange={setPhoneValue}
            defaultCountry={props.defaultCountry}
            className={baseClasses}
            required={props.required}
            international
            countryCallingCodeEditable={false}
          />
          <input type="hidden" name={props.name} value={phoneValue || ""} />
        </div>
      </div>
    );
  }

  if (props.type === "checkbox") {
    return (
      <div className={`flex items-center gap-2 ${props.className || ""}`}>
        <input
          id={props.name}
          type="checkbox"
          name={props.name}
          defaultChecked={!!props.defaultValue || props.defaultChecked}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor={props.name} className="text-sm text-gray-700">
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
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
        defaultValue={props.defaultValue as string | number | undefined}
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
