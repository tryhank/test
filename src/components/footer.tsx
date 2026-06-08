import { useTranslations } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslations();

  return (
    <footer className="border-t py-6">
      <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
        <p>
          {t.footer.builtWith}{" "}
          <a
            href="https://tanstack.com/start"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            TanStack Start
          </a>
          {" + "}
          <a
            href="https://ui.shadcn.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            shadcn/ui
          </a>
        </p>
      </div>
    </footer>
  );
}
