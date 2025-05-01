import { useState } from "react";
import { format, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Safe date formatting utility function
const formatDateSafe = (date: any) => {
  try {
    if (!date) return "";
    const dateObj = new Date(date);
    if (!isValid(dateObj)) return "Invalid date";
    return format(dateObj, "PPP");
  } catch (error) {
    console.error("Date format error:", error);
    return "Invalid date";
  }
};

interface DatePickerProps {
  field: any;
  label?: string;
  isRequired?: boolean;
}

export function InvoiceDatePicker({ field, label, isRequired = false }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={"outline"}
            className={cn(
              "pl-3 text-left font-normal",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value ? (
              formatDateSafe(field.value)
            ) : (
              <span>Pick a date</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={field.value ? new Date(field.value) : undefined}
          onSelect={field.onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
