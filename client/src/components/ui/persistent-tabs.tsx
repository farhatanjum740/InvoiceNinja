import React, { useState, useEffect, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PersistentTabsProps {
  defaultValue: string;
  values: string[];
  children: ReactNode[];
  triggerLabels: string[];
  onValueChange?: (value: string) => void;
  className?: string;
  triggerClassName?: string;
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
}: PersistentTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={className}>
      <TabsList 
        className={`grid w-full grid-cols-${values.length} ${triggerClassName || ""}`}
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

      {/* Render all content but only show the active one */}
      {values.map((value, index) => (
        <div key={value} style={{ display: value === activeTab ? "block" : "none" }}>
          {children[index]}
        </div>
      ))}
    </Tabs>
  );
}