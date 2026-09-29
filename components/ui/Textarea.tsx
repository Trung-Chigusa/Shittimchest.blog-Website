import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldClasses } from "@/components/ui/Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClasses, "min-h-28 resize-y py-3 leading-relaxed", className)} {...props} />
));

Textarea.displayName = "Textarea";
