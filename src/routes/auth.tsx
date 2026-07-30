import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import logo from "@/assets/bp-info-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — BP Info Gestão" },
      {
        name: "description",
        content: "Acesse o painel de gestão da BP Info: ordens de serviço, orçamentos e financeiro.",
      },
      { property: "og:title", content: "Entrar — BP Info Gestão" },
      {
        property: "og:description",
        content: "Acesse o painel de gestão da assistência técnica BP Info.",
      },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
});

const signupSchema = loginSchema.extend({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { nome: "", email: "", password: "" },
  });

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
      return;
    }
    toast.success("Bem-vindo de volta!");
    void navigate({ to: "/dashboard", replace: true });
  };

  const onSignup = async (values: z.infer<typeof signupSchema>) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome: values.nome },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    if (data.session) {
      void navigate({ to: "/dashboard", replace: true });
      return;
    }
    toast.success("Conta criada", {
      description: "Confirme seu e-mail para acessar o sistema.",
    });
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 bg-[var(--gradient-glow)]" />

      <section className="relative hidden flex-col justify-between border-r border-border/70 bg-card/40 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white p-2">
            <img src={logo} alt="Logo BP Info" width={32} height={32} className="size-full object-contain" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">BP Info Gestão</p>
            <p className="text-xs text-muted-foreground">Assistência técnica e serviços de TI</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="max-w-md text-4xl leading-tight font-extrabold tracking-tight">
            Toda a sua operação técnica em <span className="text-gradient">um só painel</span>.
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Ordens de serviço com timeline e histórico completo",
              "Orçamentos profissionais prontos para PDF e aprovação online",
              "Controle financeiro, estoque e agenda integrados",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-glow" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          BP Info · CNPJ 27.592.687/0001-58 · Ribeirão Preto — SP
        </p>
      </section>

      <section className="relative flex items-center justify-center p-6">
        <Card className="surface-card w-full max-w-md p-7">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
              <img src={logo} alt="Logo BP Info" width={28} height={28} className="size-full object-contain" />
            </div>
            <p className="text-lg font-bold">BP Info Gestão</p>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="pt-6">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="voce@bpinfo.com.br" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Entrar no sistema
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="signup" className="pt-6">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <FormField
                    control={signupForm.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" autoComplete="name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="voce@bpinfo.com.br" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Mínimo de 6 caracteres"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Criar minha conta
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            O primeiro usuário cadastrado recebe o perfil de Administrador.
          </p>
        </Card>
      </section>
    </div>
  );
}