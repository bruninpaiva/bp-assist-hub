import { dataCurta, dataHora } from "@/lib/format";

export function DateDisplay({
  value,
  mode = "short",
}: {
  value: string | Date | null | undefined;
  mode?: "short" | "full";
}) {
  return <>{mode === "full" ? dataHora(value) : dataCurta(value)}</>;
}
