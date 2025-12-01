"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar as CalendarIcon, X } from "lucide-react";

export default function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    const parseDateLocal = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    if (startParam) {
      setStartDate(parseDateLocal(startParam));
    } else {
      setStartDate(new Date());
    }

    if (endParam) {
      setEndDate(parseDateLocal(endParam));
    } else {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setEndDate(nextMonth);
    }
  }, [searchParams]);

  const formatDateToLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("startDate", formatDateToLocal(start));
      params.set("endDate", formatDateToLocal(end));
      params.set("page", "1"); // Reset to first page on filter change
      router.push(`/?${params.toString()}`);
    }
  };

  const handleClear = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    setStartDate(today);
    setEndDate(nextMonth);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("startDate");
    params.delete("endDate");
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
      <CalendarIcon className="w-5 h-5 text-slate-500 ml-2" />
      <DatePicker
        selectsRange={true}
        startDate={startDate || undefined}
        endDate={endDate || undefined}
        onChange={handleDateChange}
        className="text-sm text-slate-700 focus:outline-none w-[170px]"
        dateFormat="dd/MM/yyyy"
        placeholderText="Seleccionar fechas"
      />
      {(searchParams.get("startDate") || searchParams.get("endDate")) && (
        <button
          onClick={handleClear}
          className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          title="Limpiar filtro"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
