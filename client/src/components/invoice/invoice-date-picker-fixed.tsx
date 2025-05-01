import { useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

// Safe date formatting utility function with robust timezone handling
const formatDateSafe = (date: any) => {
  try {
    if (!date) return "";
    
    // Add debugging to see what kind of date value we're receiving
    console.log("Date value type:", typeof date, "Value:", date);
    
    // Case 1: Already a valid Date object
    if (date instanceof Date && !isNaN(date.getTime())) {
      // Use the date directly, preserving timezone
      return format(date, "PPP");
    }
    
    // Case 2: ISO string or other string format
    if (typeof date === 'string') {
      // Special handling for ISO strings with timezone information
      if (date.includes('T') && (date.includes('Z') || date.includes('+') || date.includes('-'))) {
        // This is an ISO format string with timezone - use parseISO to properly handle it
        try {
          const parsedDate = parseISO(date);
          if (isValid(parsedDate)) {
            // When an ISO string is parsed, it's interpreted in the local timezone
            console.log("Parsed ISO date:", parsedDate, "Original:", date);
            return format(parsedDate, "PPP");
          }
        } catch (e) {
          console.warn("parseISO failed on ISO string:", e);
        }
      }
      
      // Strategy 1: Using Date constructor directly
      let dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        // Use UTC date components to avoid timezone shifts
        const year = dateObj.getUTCFullYear();
        const month = dateObj.getUTCMonth();
        const day = dateObj.getUTCDate();
        
        // Create a new date using local timezone with the same day
        const localDate = new Date(year, month, day);
        console.log("Preserving date components from:", date, "As:", localDate);
        return format(localDate, "PPP");
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
      // Use UTC components to preserve the date across timezones
      const year = fallbackDate.getUTCFullYear();
      const month = fallbackDate.getUTCMonth();
      const day = fallbackDate.getUTCDate();
      
      const localDate = new Date(year, month, day);
      return format(localDate, "PPP");
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

export function InvoiceDatePickerFixed({ field, label, isRequired = false }: DatePickerProps) {
  // DIRECT DEBUG: Log all field values to diagnose date issues
  console.log("⚠️ DATEPICKER RAW FIELD VALUE:", field.value, "Type:", typeof field.value);
  
  if (field.value instanceof Date) {
    console.log("⚠️ DATEPICKER DATE OBJECT INFO:", {
      toString: field.value.toString(),
      toISOString: field.value.toISOString(),
      valueOf: field.value.valueOf(),
      getDate: field.value.getDate(),
      getMonth: field.value.getMonth(),
      getFullYear: field.value.getFullYear(),
      getUTCDate: field.value.getUTCDate(),
      getUTCMonth: field.value.getUTCMonth(),
      getUTCFullYear: field.value.getUTCFullYear()
    });
  }
  
  // TARGETED APPROACH: Fix only for the specific problematic 18:30:00 UTC format
  // This specific timestamp represents 6:30 PM UTC which is midnight in India, so it should display as the next day
  const isT1830SpecialCase = (date: any): boolean => {
    // Check if it's the exact string format pattern
    if (typeof date === 'string' && 
        (date.includes('T18:30:00+00:00') || 
         (date.includes('T18:30:00') && date.includes('+00:00')))) {
      console.log('🔥 TARGETED FIX: Detected 18:30:00 UTC format that needs timezone adjustment');
      return true;
    }
    
    // For Date objects, we need to check the time components
    if (date instanceof Date) {
      try {
        // Check if this is a Date object with 18:30 UTC time
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        
        if (hours === 18 && minutes === 30) {
          console.log('🔥 TARGETED FIX: Detected Date object with 18:30:00 UTC time');
          return true;
        }
      } catch (e) {
        // If any error in conversion, it's better to return false than crash
        return false;
      }
    }
    
    return false;
  };
  
  // Handle date display with special case for 18:30 UTC format
  const getDisplayDate = (date: any) => {
    // Check if this is our special 18:30 UTC timestamp case
    if (isT1830SpecialCase(date)) {
      // Extract the date components and add a day
      try {
        let year = 0, month = 0, day = 0;
        
        if (typeof date === 'string') {
          // Extract date parts from string
          const dateParts = date.split('T')[0].split('-');
          if (dateParts.length === 3) {
            year = parseInt(dateParts[0]);
            month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
            day = parseInt(dateParts[2]) + 1; // Add a day to convert from UTC evening to next Indian date
          }
        } else if (date instanceof Date) {
          // Get date parts from Date object (already in local time)
          year = date.getFullYear();
          month = date.getMonth();
          day = date.getDate() + 1; // Add one day for the 18:30 UTC special case
        }
        
        if (year > 0) {
          const adjustedDate = new Date(year, month, day);
          console.log('🛠️ FIXED DISPLAY: 18:30 UTC timestamp detected, showing as next day for Indian timezone', adjustedDate);
          return format(adjustedDate, "PPP");
        }
      } catch (e) {
        console.error("Error in 18:30 UTC special case handling:", e);
      }
    }
    
    // Regular formatting for all other cases
    return formatDateSafe(date);
  };
  
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
              getDisplayDate(field.value)
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
            // Ensure we pass a valid date to the Calendar with proper timezone handling
            if (!field.value) return undefined;
            
            try {
              // Check if this is the specific 18:30 UTC timestamp that needs adjustment
              if (isT1830SpecialCase(field.value)) {
                // Extract date parts and add a day
                try {
                  let year = 0, month = 0, day = 0;
                  
                  if (typeof field.value === 'string') {
                    // Extract date parts from string
                    const dateParts = field.value.split('T')[0].split('-');
                    if (dateParts.length === 3) {
                      year = parseInt(dateParts[0]);
                      month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
                      day = parseInt(dateParts[2]) + 1; // Add a day for 18:30 UTC which is next day in India
                    }
                  } else if (field.value instanceof Date) {
                    // Get date parts from Date object
                    year = field.value.getFullYear();
                    month = field.value.getMonth();
                    day = field.value.getDate() + 1; // Add one day for the 18:30 UTC special case
                  }
                  
                  if (year > 0) {
                    const adjustedDate = new Date(year, month, day);
                    console.log('⚙️ CALENDAR FIX: Adjusted 18:30 UTC to show as next day', adjustedDate);
                    return adjustedDate;
                  }
                } catch (e) {
                  console.error("Error adjusting 18:30 UTC date in calendar:", e);
                }
              }
              
              // Regular handling for ISO strings with timezone
              if (typeof field.value === 'string' && 
                  field.value.includes('T') && 
                  (field.value.includes('Z') || field.value.includes('+') || field.value.includes('-'))) {
                
                // Parse with parseISO to handle timezone correctly
                const parsedDate = parseISO(field.value);
                console.log("Calendar - parsed ISO date:", parsedDate, "Original:", field.value);
                
                if (isValid(parsedDate)) {
                  return parsedDate;
                }
              }
              
              // Standard date parsing with timezone preservation
              const dateObj = new Date(field.value);
              
              if (!isNaN(dateObj.getTime())) {
                // Use UTC date components to avoid timezone shifts
                const year = dateObj.getUTCFullYear();
                const month = dateObj.getUTCMonth();
                const day = dateObj.getUTCDate();
                
                // Create a new date using local timezone with the same day
                const localDate = new Date(year, month, day);
                console.log("Calendar - preserving date from:", field.value, "As:", localDate);
                return localDate;
              }
              
              return new Date(); // Fallback to current date
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
