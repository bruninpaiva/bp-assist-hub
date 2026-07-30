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
import { Building2, ShieldCheck, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { configService, queryKeys } from "@/services/queries";
import { roleLabels, statusOSLabels } from "@/lib/labels";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/types/domain";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — BP Info Gestão" },
      { name: "description", content: "Dados da empresa, usuários, permissões, categorias e preferências do sistema." },
      { property: "og:title", content: "Configurações — BP Info Gestão" },
      { property: "og:description", content: "Dados da empresa, usuários, permissões, categorias e preferências do sistema." },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { isAdmin } = useAuth();
  const empresa = useQuery({ queryKey: queryKeys.empresa, queryFn: configService.empresa });
  const usuarios = useQuery({ queryKey: queryKeys.usuarios, queryFn: configService.usuarios });

  const campos: { label: string; value: string | null | undefined }[] = [
    { label: "Nome fantasia", value: empresa.data?.nome_fantasia },
    { label: "CNPJ", value: empresa.data?.cnpj },
    { label: "Telefone", value: empresa.data?.telefone },
    { label: "WhatsApp", value: empresa.data?.whatsapp },
    { label: "E-mail", value: empresa.data?.email },
    { label: "Cidade / UF", value: [empresa.data?.cidade, empresa.data?.uf].filter(Boolean).join(" / ") },
  ];

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Parâmetros gerais do sistema, dados cadastrais da empresa e controle de acesso."
      />

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base">Preferências do sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="empresa">
            <TabsList>
              <TabsTrigger value="empresa">Empresa</TabsTrigger>
              <TabsTrigger value="usuarios">Usuários</TabsTrigger>
              <TabsTrigger value="permissoes">Permissões</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>

            <TabsContent value="empresa" className="pt-4">
              {empresa.isLoading ? (
                <TableSkeleton rows={3} cols={2} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {campos.map((c) => (
                    <div key={c.label} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{c.label}</Label>
                      <Input defaultValue={c.value ?? ""} readOnly={!isAdmin} />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <Button
                      disabled={!isAdmin}
                      onClick={() => toast.info("Edição dos dados da empresa chega no próximo módulo.")}
                    >
                      <Building2 className="size-4" /> Salvar dados
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="usuarios" className="pt-4">
              {usuarios.isLoading ? (
                <TableSkeleton cols={3} />
              ) : !usuarios.data?.length ? (
                <EmptyState icon={Users} title="Nenhum usuário encontrado" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Perfis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.data.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nome || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell className="flex flex-wrap gap-1.5">
                          {(u.roles as AppRole[]).map((r) => (
                            <StatusBadge key={r} label={roleLabels[r]} tone="primary" />
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="permissoes" className="grid gap-3 pt-4 sm:grid-cols-2">
              {(Object.keys(roleLabels) as AppRole[]).map((role) => (
                <div
                  key={role}
                  className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3.5"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary-glow" />
                    <p className="font-medium">{roleLabels[role]}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {role === "admin"
                      ? "Acesso total ao sistema, usuários e configurações."
                      : role === "tecnico"
                        ? "Ordens de serviço, equipamentos e agenda."
                        : role === "financeiro"
                          ? "Financeiro, orçamentos e relatórios."
                          : "Atendimento, clientes e abertura de OS."}
                  </p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="status" className="flex flex-wrap gap-2 pt-4">
              {Object.values(statusOSLabels).map((s) => (
                <StatusBadge key={s.label} {...s} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
