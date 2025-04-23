import React, { useState, useEffect, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PersistentTabsProps {
  defaultValue: string;
  values: string[];
  children: ReactNode[];
  triggerLabels: string[];
  onValueChange?: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  preserveState?: boolean;
}

/**
 * PersistentTabs component that maintains state between tab changes
 * All tab contents remain mounted while switching tabs
 */
export function PersistentTabs({
  defaultValue,
  values,
  children,
  triggerLabels,
  onValueChange,
  className,
  triggerClassName,
  preserveState = true,
}: PersistentTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const [previousTab, setPreviousTab] = useState<string | null>(null);

  // Handle tab change with animation direction
  const handleTabChange = (value: string) => {
    if (value !== activeTab) {
      setPreviousTab(activeTab);
      setActiveTab(value);
      
      if (onValueChange) {
        onValueChange(value);
      }
      
      // Save the current tab to localStorage for persistence across page reloads
      localStorage.setItem('lastActiveTab', value);
    }
  };

  // Restore the last active tab on component mount
  useEffect(() => {
    const lastTab = localStorage.getItem('lastActiveTab');
    if (lastTab && values.includes(lastTab)) {
      setActiveTab(lastTab);
      if (onValueChange) {
        onValueChange(lastTab);
      }
    }
  }, []);

  // Determine animation direction
  const getAnimationDirection = (tabValue: string) => {
    if (!previousTab) return 0;
    const prevIndex = values.indexOf(previousTab);
    const currentIndex = values.indexOf(tabValue);
    return prevIndex < currentIndex ? 1 : -1;
  };

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction * 20,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction * -20,
      opacity: 0
    })
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={className}>
      <TabsList 
        className={cn("grid w-full", triggerClassName)}
        style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
      >
        {values.map((value, index) => (
          <TabsTrigger 
            key={value} 
            value={value}
            disabled={triggerLabels[index].includes("disabled")}
          >
            {triggerLabels[index].replace(" (disabled)", "")}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Render all content but with smooth transitions */}
      {preserveState ? (
        // Keep all tabs mounted but only show the active one
        values.map((value, index) => (
          <div key={value} className={cn("mt-2", value === activeTab ? "block" : "hidden")}>
            {children[index]}
          </div>
        ))
      ) : (
        // Use AnimatePresence for animated tab transitions
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            custom={getAnimationDirection(activeTab)}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            {children[values.indexOf(activeTab)]}
          </motion.div>
        </AnimatePresence>
      )}
    </Tabs>
  );
}