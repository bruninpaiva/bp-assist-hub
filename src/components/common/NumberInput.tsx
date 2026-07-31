import { forwardRef, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

/** Input numérico controlado pelo React Hook Form — sempre emite `number`, nunca string. */
export const NumberInput = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<"input">, "onChange" | "type"> & { onChange: (value: number) => void }
>(({ onChange, ...props }, ref) => (
  <Input
    type="number"
    ref={ref}
    {...props}
    onChange={(e) => onChange(e.target.valueAsNumber || 0)}
  />
));
NumberInput.displayName = "NumberInput";
