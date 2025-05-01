import { useState, useEffect } from "react";
import { format, isValid, parse } from "date-fns";
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
  // Internal state to track selected date
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Handle field.value changes and update internal state
  useEffect(() => {
    if (!field.value) {
      setSelectedDate(null);
      return;
    }
    
    let dateValue = null;
    console.log('Date picker value type:', typeof field.value, field.value);
    
    // Case 1: Simple YYYY-MM-DD string format (what our server now returns)
    if (typeof field.value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(field.value)) {
      try {
        console.log('Parsing simple YYYY-MM-DD format:', field.value);
        const [year, month, day] = field.value.split('-').map(Number);
        dateValue = new Date(year, month-1, day);
      } catch (err) {
        console.error('Error parsing simple date format:', err);
      }
    }
    // Case 2: Special timestamp format with T18:30:00+00:00
    else if (typeof field.value === 'string' && field.value.includes('T18:30:00')) {
      try {
        console.log('Parsing special Indian date format:', field.value);
        const datePart = field.value.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        // For 18:30 UTC format dates, we add a day for Indian time
        dateValue = new Date(year, month-1, day+1);
      } catch (err) {
        console.error('Error parsing special date format:', err);
      }
    }
    // Case 3: Date object
    else if (field.value instanceof Date && !isNaN(field.value.getTime())) {
      dateValue = field.value;
    }
    // Case 4: Any other string that Date constructor can parse
    else if (typeof field.value === 'string') {
      try {
        const parsedDate = new Date(field.value);
        if (!isNaN(parsedDate.getTime())) {
          dateValue = parsedDate;
        }
      } catch (err) {
        console.error('Error parsing date string:', err);
      }
    }
    
    if (dateValue && !isNaN(dateValue.getTime())) {
      console.log('✅ Successfully parsed date:', dateValue);
      setSelectedDate(dateValue);
    } else {
      console.warn('⚠️ Failed to parse date value:', field.value);
      setSelectedDate(null);
    }
  }, [field.value]);
  
  // Handle date selection from the calendar
  const handleSelect = (date: Date | undefined) => {
    console.log('Date selected from calendar:', date);
    setSelectedDate(date || null);
    field.onChange(date);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={"outline"}
            className={cn(
              "pl-3 text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
            type="button" // Prevent form submission
          >
            {selectedDate ? (
              format(selectedDate, "PPP")
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
          selected={selectedDate || undefined}
          onSelect={handleSelect}
          initialFocus
          disabled={(date) => date < new Date("1900-01-01")}
        />
      </PopoverContent>
    </Popover>
  );
}