import * as React from "react";
import { Check, Grid3X3, LayoutTemplate } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

const templates = [
  {
    id: "standard",
    name: "Standard",
    description: "Professional default invoice with clean layout",
    previewImage: "standard.png",
    layout: "standard"
  },
  {
    id: "classic",
    name: "Classic",
    description: "Traditional invoice with a formal appearance",
    previewImage: "classic.png",
    layout: "classic"
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary design with sleek elements",
    previewImage: "modern.png",
    layout: "modern"
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple, clean design with essential information only",
    previewImage: "minimal.png",
    layout: "minimal"
  }
];

const colorThemes = [
  { id: "blue", name: "Blue", color: "#3b82f6" },
  { id: "green", name: "Green", color: "#10b981" },
  { id: "purple", name: "Purple", color: "#8b5cf6" },
  { id: "orange", name: "Orange", color: "#f97316" },
  { id: "red", name: "Red", color: "#ef4444" },
  { id: "gray", name: "Gray", color: "#6b7280" },
];

interface InvoiceTemplateProps {
  onTemplateSelect: (templateId: string) => void;
  onColorSelect: (colorId: string) => void;
  selectedTemplate: string;
  selectedColor: string;
}

export function InvoiceTemplateSelector({
  onTemplateSelect,
  onColorSelect,
  selectedTemplate = "standard",
  selectedColor = "blue",
}: InvoiceTemplateProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutTemplate size={16} />
          Template Options
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Invoice Template Settings</DialogTitle>
          <DialogDescription>
            Choose a template and customize colors for your invoice
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="templates" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className={cn(
                    "cursor-pointer hover:border-primary transition-all",
                    selectedTemplate === template.id && "border-primary ring-2 ring-primary ring-opacity-20"
                  )}
                  onClick={() => onTemplateSelect(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-2">
                      <Grid3X3 size={40} className="text-gray-400" />
                    </div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.description}</p>
                  </CardContent>
                  <CardFooter className="p-2 bg-gray-50 flex justify-end">
                    {selectedTemplate === template.id && (
                      <Check size={16} className="text-primary" />
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="colors" className="mt-4">
            <RadioGroup 
              defaultValue={selectedColor}
              onValueChange={onColorSelect}
              className="grid grid-cols-3 gap-4"
            >
              {colorThemes.map((color) => (
                <div key={color.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={color.id} id={color.id} />
                  <Label 
                    htmlFor={color.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: color.color }}
                    />
                    {color.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}