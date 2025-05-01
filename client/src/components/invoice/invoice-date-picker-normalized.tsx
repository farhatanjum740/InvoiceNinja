import { useState, useEffect } from "react";
import { format } from "date-fns";
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
 * Simplified date picker that assumes dates from server are already normalized to YYYY-MM-DD
 * This component focuses entirely on displaying and selecting dates without complex parsing
 */
export function InvoiceDatePickerNormalized({ field, label, isRequired = false }: DatePickerProps) {
  // Internal state to track selected date
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Parse simple YYYY-MM-DD format strings from server
  const parseNormalizedDate = (dateString: string | null | undefined): Date | null => {
    if (!dateString) return null;
    
    try {
      // For simple YYYY-MM-DD format (what our server now returns)
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.log('Invoice Date Picker: Using normalized date from server:', dateString);
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month-1, day);
      }
      
      // For Date objects
      if (dateString instanceof Date && !isNaN(dateString.getTime())) {
        return dateString;
      }
      
      // Attempt to parse anything else
      const date = new Date(dateString);
      return !isNaN(date.getTime()) ? date : null;
    } catch (e) {
      console.error('Error parsing date:', e);
      return null;
    }
  };
  
  // Update internal state when field.value changes
  useEffect(() => {
    const date = parseNormalizedDate(field.value);
    setSelectedDate(date);
  }, [field.value]);
  
  // Handle date selection from the calendar
  const handleSelect = (date: Date | undefined) => {
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
        />
      </PopoverContent>
    </Popover>
  );
}
