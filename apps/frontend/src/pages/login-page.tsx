import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@gradusy24/shared";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";

export function LoginPage() {
  const navigate = useNavigate();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@gradusy24.kz",
      password: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: () => navigate("/app")
  });

  function onSubmit(values: LoginInput) {
    loginMutation.mutate(values);
  }

  return (
    <main className="container grid min-h-screen place-items-center py-10">
      <div className="w-full max-w-md">
        <Button asChild variant="ghost" className="mb-5">
          <Link to="/">
            <ArrowLeft className="size-4" />
            На страницу
          </Link>
        </Button>

        <Card className="overflow-hidden">
          <div className="brand-surface p-6">
            <BrandLogo className="h-20 bg-transparent shadow-none" />
          </div>
          <CardHeader>
            <CardTitle>Вход в CMS</CardTitle>
            <CardDescription>Управление действиями, QR-кодами, оформлением и статистикой.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" className="pl-11" {...form.register("email")} />
                </div>
                {form.formState.errors.email ? (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-11"
                    autoComplete="current-password"
                    {...form.register("password")}
                  />
                </div>
                {form.formState.errors.password ? (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              {loginMutation.isError ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-destructive">
                  Не удалось войти. Проверьте email и пароль.
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Входим..." : "Войти"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
