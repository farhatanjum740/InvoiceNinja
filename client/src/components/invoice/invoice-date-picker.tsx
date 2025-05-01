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
    
    // Add debugging to see what kind of date value we're receiving
    console.log("Date value type:", typeof date, "Value:", date);
    
    // Handle different date formats
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      // Handle ISO string format from Supabase
      dateObj = new Date(date);
    } else {
      // Try to convert other formats
      dateObj = new Date(date);
    }
    
    // Validate the date
    if (!isValid(dateObj)) {
      console.warn("Invalid date object created from:", date);
      return "Invalid date";
    }
    
    return format(dateObj, "PPP");
  } catch (error) {
    console.error("Date format error:", error, "for input:", date);
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
