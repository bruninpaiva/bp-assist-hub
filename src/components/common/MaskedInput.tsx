import { forwardRef, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

export const MaskedInput = forwardRef<
  HTMLInputElement,
  ComponentProps<"input"> & { mask: (value: string) => string }
>(({ mask, onChange, ...props }, ref) => (
  <Input
    {...props}
    ref={ref}
    onChange={(e) => {
      e.target.value = mask(e.target.value);
      onChange?.(e);
    }}
  />
));
MaskedInput.displayName = "MaskedInput";
