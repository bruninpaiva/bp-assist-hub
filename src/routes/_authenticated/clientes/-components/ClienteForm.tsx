import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MaskedInput } from "@/components/common/MaskedInput";
import { LoadingState } from "@/components/common/LoadingState";
import { FormSection } from "@/components/forms/FormSection";
import { maskCEP, maskCNPJ, maskCPF, maskTelefone, onlyDigits } from "@/lib/masks";
import { clientesService } from "@/services/queries";
import { fetchAddressByCep } from "@/services/viacep";
import {
  clienteSchema,
  defaultClienteFormValues,
  toClientePayload,
  type ClienteFormValues,
} from "../-lib/schema";
import type { Cliente } from "@/types/domain";

export function ClienteForm({
  clienteId,
  defaultValues = defaultClienteFormValues,
  onCancel,
  onSaved,
}: {
  clienteId?: string;
  defaultValues?: ClienteFormValues;
  onCancel: () => void;
  onSaved: (cliente: Cliente) => void;
}) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  });

  const tipoPessoa = form.watch("tipo_pessoa");

  const handleCepBlur = async (cep: string | undefined) => {
    if (onlyDigits(cep).length !== 8) return;
    setCepLoading(true);
    try {
      const endereco = await fetchAddressByCep(cep ?? "");
      if (!endereco) {
        toast.error("CEP não encontrado");
        return;
      }
      form.setValue("endereco", endereco.logradouro, { shouldDirty: true });
      form.setValue("bairro", endereco.bairro, { shouldDirty: true });
      form.setValue("cidade", endereco.localidade, { shouldDirty: true });
      form.setValue("uf", endereco.uf, { shouldDirty: true });
    } catch {
      toast.error("Não foi possível consultar o CEP. Preencha o endereço manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  const onSubmit = async (values: ClienteFormValues) => {
    setSubmitting(true);
    try {
      const duplicado = await clientesService.checkDuplicado({
        cpf: values.tipo_pessoa === "fisica" ? values.cpf : null,
        cnpj: values.tipo_pessoa === "juridica" ? values.cnpj : null,
        excluirId: clienteId,
      });
      if (duplicado) {
        const campo = values.tipo_pessoa === "fisica" ? "cpf" : "cnpj";
        form.setError(campo, {
          message: `Já existe um cliente cadastrado com este ${campo === "cpf" ? "CPF" : "CNPJ"}.`,
        });
        return;
      }

      const payload = toClientePayload(values);
      const cliente = clienteId
        ? await clientesService.update(clienteId, payload)
        : await clientesService.create(payload);

      await queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success(clienteId ? "Cliente atualizado" : "Cliente cadastrado");
      onSaved(cliente as Cliente);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar cliente";
      const duplicidade =
        message.includes("idx_clientes_cpf_unico") || message.includes("idx_clientes_cnpj_unico");
      toast.error(
        duplicidade
          ? "Já existe um cliente cadastrado com este documento."
          : "Não foi possível salvar o cliente",
        duplicidade ? undefined : { description: message },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormSection title="Identificação">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="tipo_pessoa"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Tipo de cliente</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-6"
                    >
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="fisica" />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">Pessoa Física</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="juridica" />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">
                          Pessoa Jurídica
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {tipoPessoa === "juridica" ? "Nome de exibição" : "Nome completo"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        tipoPessoa === "juridica"
                          ? "Nome fantasia ou razão social"
                          : "Nome do cliente"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {tipoPessoa === "fisica" ? (
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <MaskedInput mask={maskCPF} placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <>
              <FormField
                control={form.control}
                name="razao_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão social</FormLabel>
                    <FormControl>
                      <Input placeholder="Razão social registrada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nome_fantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome fantasia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <MaskedInput mask={maskCNPJ} placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inscricao_estadual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inscrição estadual</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </FormSection>

        <FormSection title="Contato">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="cliente@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <MaskedInput mask={maskTelefone} placeholder="(00) 0000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl>
                  <MaskedInput mask={maskTelefone} placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Endereço" description="Informe o CEP para preencher automaticamente.">
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  CEP {cepLoading ? <LoadingState className="size-3.5" /> : null}
                </FormLabel>
                <FormControl>
                  <MaskedInput
                    mask={maskCEP}
                    placeholder="00000-000"
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                      void handleCepBlur(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input placeholder="Nº" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, avenida..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="complemento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <Input placeholder="Apto, sala, bloco..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="uf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl>
                  <Input maxLength={2} placeholder="SP" className="uppercase" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title="Outras informações">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anotações internas sobre o cliente"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="cursor-pointer">Cliente ativo</FormLabel>
              </FormItem>
            )}
          />
        </FormSection>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <LoadingState /> : null}
            {clienteId ? "Salvar alterações" : "Cadastrar cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
