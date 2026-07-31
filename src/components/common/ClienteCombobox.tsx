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
import { clientesService, queryKeys } from "@/services/queries";
import { useDebounced } from "@/hooks/use-debounced";
import { cn } from "@/lib/utils";

export function ClienteCombobox({
  value,
  label,
  onChange,
  placeholder = "Selecione um cliente",
}: {
  value?: string;
  /** Nome já conhecido do cliente selecionado, exibido antes da busca carregar (ex.: ao editar). */
  label?: string;
  onChange: (id: string, nome: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounced(busca, 250);

  const params = { busca: buscaDebounced, porPagina: 20 };
  const { data, isFetching } = useQuery({
    queryKey: queryKeys.clientes(params),
    queryFn: () => clientesService.list(params),
    enabled: open,
  });

  const clientes = data?.data ?? [];
  const selecionado = clientes.find((c) => c.id === value);
  const textoExibido = selecionado?.nome ?? (value ? label : undefined) ?? placeholder;

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
          <CommandInput placeholder="Buscar cliente..." value={busca} onValueChange={setBusca} />
          <CommandList>
            {isFetching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Buscando...
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                <CommandGroup>
                  {clientes.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={() => {
                        onChange(c.id, c.nome);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn("size-4", value === c.id ? "opacity-100" : "opacity-0")}
                      />
                      {c.nome}
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
