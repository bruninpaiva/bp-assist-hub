import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { clientesService, queryKeys } from "@/services/queries";
import { tipoPessoaLabels } from "@/lib/labels";
import { dataCurta } from "@/lib/format";
import type { Cliente } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — BP Info Gestão" },
      { name: "description", content: "Cadastro de clientes pessoa física e jurídica com contatos, documentos e endereço." },
      { property: "og:title", content: "Clientes — BP Info Gestão" },
      { property: "og:description", content: "Cadastro de clientes pessoa física e jurídica com contatos, documentos e endereço." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const [busca, setBusca] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.clientes,
    queryFn: clientesService.list,
  });

  const clientes = ((data ?? []) as Cliente[]).filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Base de clientes da assistência técnica, com dados de contato e histórico."
        actions={
          <Button onClick={() => toast.info("Cadastro de clientes chega no próximo módulo.")}>
            <Plus className="size-4" /> Novo cliente
          </Button>
        }
      />

      <Card className="surface-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Lista de clientes</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome"
              className="h-9 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton cols={5} />
          ) : clientes.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum cliente cadastrado"
              description="Os clientes cadastrados aparecerão aqui com contatos, equipamentos e ordens vinculadas."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={tipoPessoaLabels[c.tipo_pessoa]}
                        tone={c.tipo_pessoa === "juridica" ? "primary" : "info"}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {c.cnpj || c.cpf || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.whatsapp || c.telefone || c.email || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {dataCurta(c.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
