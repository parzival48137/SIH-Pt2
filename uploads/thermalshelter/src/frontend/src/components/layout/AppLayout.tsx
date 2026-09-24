import { BottomNav } from "@/components/layout/BottomNav";
import { PageHeader } from "@/components/layout/PageHeader";
import type { ReactNode } from "react";

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AppLayout({ title, subtitle, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PageHeader title={title} subtitle={subtitle} />
      <main
        data-ocid="page.content"
        className="mx-auto w-full max-w-md flex-1 px-4 pb-28 pt-4"
      >
        {children}
      </main>
      <footer className="mx-auto w-full max-w-md px-4 pb-24 pt-2">
        <p className="text-center text-[0.6875rem] text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
      <BottomNav />
    </div>
  );
}
