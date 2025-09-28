import React from "react";

// Simple utility function for conditional class names
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        style={{
          display: 'flex',
          minHeight: '80px',
          width: '100%',
          borderRadius: '6px',
          border: '1px solid #ccc',
          padding: '8px 12px',
          fontSize: '14px',
          ...style
        }}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";