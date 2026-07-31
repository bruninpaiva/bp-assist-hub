import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ordensService, queryKeys } from "@/services/queries";
import { useDebounced } from "@/hooks/use-debounced";
import { cn } from "@/lib/utils";
import type { OSComRelacoes } from "@/types/domain";

export function OrdemServicoCombobox({
  value,
  label,
  onChange,
  placeholder = "Selecione uma ordem de serviço",
}: {
  value?: string;
  /** Rótulo já conhecido da OS selecionada, exibido antes da busca carregar (ex.: ao editar). */
  label?: string;
  /** Recebe a OS completa (com cliente/equipamento) para preencher os campos derivados sem nova consulta. */
  onChange: (ordem: OSComRelacoes) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounced(busca, 250);

  const params = { busca: buscaDebounced, porPagina: 20 };
  const { data, isFetching } = useQuery({
    queryKey: queryKeys.ordens(params),
    queryFn: () => ordensService.list(params),
    enabled: open,
  });

  const ordens = (data?.data ?? []) as OSComRelacoes[];
  const selecionada = ordens.find((o) => o.id === value);
  const rotulo = (o: OSComRelacoes) => `${o.numero_os} — ${o.clientes?.nome ?? "Sem cliente"}`;
  const textoExibido = selecionada
    ? rotulo(selecionada)
    : ((value ? label : undefined) ?? placeholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{textoExibido}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar ordem de serviço..."
            value={busca}
            onValueChange={setBusca}
          />
          <CommandList>
            {isFetching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Buscando...
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhuma ordem de serviço encontrada.</CommandEmpty>
                <CommandGroup>
                  {ordens.map((o) => (
                    <CommandItem
                      key={o.id}
                      value={o.id}
                      onSelect={() => {
                        onChange(o);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn("size-4", value === o.id ? "opacity-100" : "opacity-0")}
                      />
                      {rotulo(o)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
