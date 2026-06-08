import { useTranslations } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslations();

  return (
    <footer className="border-t py-6">
      <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
        <p>{t.footer.builtWith} TanStack Start + shadcn/ui + SQLite</p>
      </div>
    </footer>
  );
}
