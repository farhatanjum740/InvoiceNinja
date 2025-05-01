import { useState } from "react";
import { format, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Safe date formatting utility function with robust fallbacks
const formatDateSafe = (date: any) => {
  try {
    if (!date) return "";
    
    // Add debugging to see what kind of date value we're receiving
    console.log("Date value type:", typeof date, "Value:", date);
    
    // Case 1: Already a valid Date object
    if (date instanceof Date && !isNaN(date.getTime())) {
      return format(date, "PPP");
    }
    
    // Case 2: ISO string or other string format
    if (typeof date === 'string') {
      // Try different parsing strategies
      
      // Strategy 1: Using Date constructor directly
      let dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return format(dateObj, "PPP");
      }
      
      // Strategy 2: Try to handle formats like YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
        // ISO format without time
        const [year, month, day] = date.split('-').map(Number);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          dateObj = new Date(year, month - 1, day);  // month is 0-indexed in JS Date
          if (!isNaN(dateObj.getTime())) {
            return format(dateObj, "PPP");
          }
        }
      }
      
      // Strategy 3: Try to parse timestamp format
      const timestamp = Number(date);
      if (!isNaN(timestamp)) {
        dateObj = new Date(timestamp);
        if (!isNaN(dateObj.getTime())) {
          return format(dateObj, "PPP");
        }
      }
    }
    
    // Case 3: If it's another type, make a last attempt
    const fallbackDate = new Date(date);
    if (!isNaN(fallbackDate.getTime())) {
      return format(fallbackDate, "PPP");
    }
    
    // If we got here, we couldn't parse the date
    console.warn("Failed to parse date value:", date);
    
    // Return current date formatted instead of error message
    // This is a user-friendly fallback for display purposes
    return format(new Date(), "PPP");
  } catch (error) {
    console.error("Date format error:", error, "for input:", date);
    return format(new Date(), "PPP"); // Return current date as fallback
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
          selected={(() => {
            // Ensure we pass a valid date to the Calendar
            if (!field.value) return undefined;
            
            try {
              const dateObj = new Date(field.value);
              return isNaN(dateObj.getTime()) ? new Date() : dateObj;
            } catch (e) {
              console.error("Error parsing date for Calendar:", e);
              return new Date(); // Fallback to current date
            }
          })()}
          onSelect={field.onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
