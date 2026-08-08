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
import { estoqueService, queryKeys } from "@/services/queries";
import { useDebounced } from "@/hooks/use-debounced";
import { brl, numero } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProdutoComRelacoes } from "@/types/domain";

/** Busca rápida de peças mostrando código, disponível e preço de venda. */
export function ProdutoCombobox({
  value,
  onChange,
  placeholder = "Buscar peça por nome, código ou marca",
}: {
  value?: string;
  onChange: (produto: ProdutoComRelacoes) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounced(busca, 250);

  const params = { busca: buscaDebounced };
  const { data, isFetching } = useQuery({
    queryKey: queryKeys.produtos(params),
    queryFn: () => estoqueService.produtos(params),
    enabled: open,
  });

  const produtos = (data ?? []) as ProdutoComRelacoes[];
  const selecionado = produtos.find((p) => p.id === value);

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
          <span className="truncate">
            {selecionado ? `${selecionado.codigo} — ${selecionado.nome}` : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(32rem,90vw)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar peça..." value={busca} onValueChange={setBusca} />
          <CommandList>
            {isFetching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Buscando...
              </div>
            ) : (
              <CommandEmpty>Nenhuma peça encontrada.</CommandEmpty>
            )}
            <CommandGroup>
              {produtos.map((p) => {
                const disponivel = Number(p.estoque_atual) - Number(p.estoque_reservado);
                return (
                  <CommandItem
                    key={p.id}
                    value={p.id}
                    onSelect={() => {
                      onChange(p);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("size-4", value === p.id ? "opacity-100" : "opacity-0")}
                    />
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="truncate">
                        <span className="font-mono text-xs text-muted-foreground">{p.codigo}</span>{" "}
                        {p.nome}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {numero(disponivel)} disp. · {brl(p.preco_venda)}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}