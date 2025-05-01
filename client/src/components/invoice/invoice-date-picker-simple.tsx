import { useState } from "react";
import { format, isValid, parse, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface DatePickerProps {
  field: any;
  label?: string;
  isRequired?: boolean;
}

/**
 * Super simple date picker component that works with our fixed server-side dates
 * This version just takes the string dates from the API and displays them directly
 */
export function InvoiceDatePickerSimple({ field, label, isRequired = false }: DatePickerProps) {
  // Get a displayable date from any source
  const getDisplayDate = () => {
    if (!field.value) return null;
    
    // Simple YYYY-MM-DD string format (what our server now returns)
    if (typeof field.value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(field.value)) {
      console.log("✅ Simple YYYY-MM-DD date format detected:", field.value);
      try {
        // Parse date without timezone complications
        const [year, month, day] = field.value.split('-').map(Number);
        return new Date(year, month-1, day);
      } catch (err) {
        console.error("Error parsing simple date format:", err);
      }
    }
    
    // Handle Date objects directly
    if (field.value instanceof Date && !isNaN(field.value.getTime())) {
      return field.value;
    }
    
    // Default case: attempt to parse whatever we have
    try {
      const dateObj = new Date(field.value);
      if (!isNaN(dateObj.getTime())) {
        return dateObj;
      }
    } catch (err) {
      console.error("Error parsing date:", err);
    }
    
    return null;
  };
  
  // Get the actual date value
  const date = getDisplayDate();
  
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
            {date ? (
              format(date, "PPP")
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
          selected={date || undefined}
          onSelect={field.onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}