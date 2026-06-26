"use client";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import PhoneInput, { type Country } from "react-phone-number-input";
import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";
import { parsePhoneNumber } from "libphonenumber-js";

type BaseFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  className?: string;
  readOnly?: boolean;
};

type InputFieldProps = BaseFieldProps & {
  type: "text" | "email" | "date" | "number" | "phone" | "checkbox" | "hidden";
  placeholder?: string;
  defaultValue?: string | number | boolean;
  pattern?: string;
  maxLength?: number;
  title?: string;
  disablePastDates?: boolean;
  disabledRanges?: { start: Date | string; end: Date | string }[];
  defaultCountry?: Country;
  defaultChecked?: boolean;
};

type SelectFieldProps = BaseFieldProps & {
  type: "select";
  options: Array<{ value: string | number | undefined; label: string }>;
  defaultValue?: string | number;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

type FormFieldProps = InputFieldProps | SelectFieldProps;

const inputBase =
  "w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 hover:border-border/80";

const labelBase = "block text-xs font-medium text-muted-foreground mb-1.5";

export function FormField(props: FormFieldProps) {
  const [dateValue, setDateValue] = useState<Date | null>(() => {
    if (props.type === "date" && props.defaultValue) {
      if (typeof props.defaultValue === "string") {
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
      if (val.startsWith("+")) return val;
      if (props.defaultCountry) {
        try {
          const phoneNumber = parsePhoneNumber(val, props.defaultCountry);
          if (phoneNumber?.isValid()) return phoneNumber.number as string;
        } catch {
          // fall through
        }
      }
      return val;
    }
    return undefined;
  });

  if (props.type === "select") {
    return (
      <div className={`flex flex-col ${props.className ?? ""}`}>
        <label htmlFor={props.name} className={labelBase}>
          {props.label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <select
          id={props.name}
          name={props.name}
          required={props.required}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          className={`${inputBase} cursor-pointer`}
        >
          {props.placeholder && (
            <option value="" disabled>
              {props.placeholder}
            </option>
          )}
          {props.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (props.type === "date") {
    const excludeIntervals = props.disabledRanges?.map((r) => ({
      start: new Date(r.start),
      end: new Date(r.end),
    }));

    return (
      <div className={`flex flex-col ${props.className ?? ""}`}>
        <label htmlFor={props.name} className={labelBase}>
          {props.label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <DatePicker
          selected={dateValue}
          onChange={(date: Date | null) => setDateValue(date)}
          name={props.name}
          dateFormat="yyyy-MM-dd"
          className={inputBase}
          placeholderText={props.placeholder ?? "Seleccionar fecha"}
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
      <div className={`flex flex-col ${props.className ?? ""}`}>
        <label htmlFor={props.name} className={labelBase}>
          {props.label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <div className="phone-input-container">
          <PhoneInput
            placeholder={props.placeholder}
            value={phoneValue}
            onChange={setPhoneValue}
            defaultCountry={props.defaultCountry}
            className={inputBase}
            required={props.required}
            international
            countryCallingCodeEditable={false}
          />
          <input type="hidden" name={props.name} value={phoneValue ?? ""} />
        </div>
      </div>
    );
  }

  if (props.type === "checkbox") {
    return (
      <div className={`flex items-center gap-3 pt-5 ${props.className ?? ""}`}>
        <div className="relative flex items-center">
          <input
            id={props.name}
            type="checkbox"
            name={props.name}
            defaultChecked={!!props.defaultValue || props.defaultChecked}
            className="h-4 w-4 rounded border-border accent-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
          />
        </div>
        <label
          htmlFor={props.name}
          className="text-sm text-foreground cursor-pointer select-none"
        >
          {props.label}
          {props.required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </label>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${props.className ?? ""}`}>
      <label htmlFor={props.name} className={labelBase}>
        {props.label}
        {props.required && <span className="text-destructive ml-1">*</span>}
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
        readOnly={props.readOnly}
        className={`${inputBase} ${props.readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
      />
    </div>
  );
}

export function FormFieldset({
  legend,
  children,
  className,
}: {
  legend: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset
      className={`rounded-xl border border-border p-4 bg-muted/20 ${className ?? ""}`}
    >
      <legend className="px-2 text-sm font-semibold text-foreground">
        {legend}
      </legend>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </fieldset>
  );
}
