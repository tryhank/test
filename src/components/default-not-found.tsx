import { Link } from "@tanstack/react-router";

import { useTranslations } from "@/lib/i18n";

import { Button } from "./ui/button";

export function DefaultNotFound() {
  const { t } = useTranslations();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">{t.common.notFound}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => window.history.back()}>
          {t.common.goBack}
        </Button>
        <Button render={<Link to="/" />} variant="secondary" nativeButton={false}>
          {t.common.home}
        </Button>
      </div>
    </div>
  );
}
