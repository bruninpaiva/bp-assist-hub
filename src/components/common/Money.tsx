import { brl } from "@/lib/format";

export function Money({ value }: { value: number | string | null | undefined }) {
  return <>{brl(value)}</>;
}
