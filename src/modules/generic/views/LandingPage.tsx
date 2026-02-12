import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <main className="container flex flex-col items-center gap-6 px-4 py-16 text-center md:py-32">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Leiloeiro AI
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Gerencie suas oportunidades de investimento e projetos com facilidade e inteligência.
        </p>
        <div className="flex gap-4">
          <Link href="/portal">
            <Button size="lg">
              Entrar na Plataforma
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
