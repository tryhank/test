import {
  RiCodeLine,
  RiPaletteLine,
  RiGlobalLine,
  RiSpeedLine,
  RiShieldLine,
  RiCloudLine,
} from "@remixicon/react";
import type { RemixiconComponentType } from "@remixicon/react";
import { createFileRoute } from "@tanstack/react-router";

import { useTranslations } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslations();

  const features: Array<{
    icon: RemixiconComponentType;
    title: string;
    description: string;
  }> = [
    {
      icon: RiCodeLine,
      title: t.features.tanstackStart,
      description: t.features.tanstackStartDesc,
    },
    { icon: RiPaletteLine, title: t.features.shadcnUi, description: t.features.shadcnUiDesc },
    { icon: RiGlobalLine, title: t.features.i18n, description: t.features.i18nDesc },
    { icon: RiSpeedLine, title: t.features.webVitals, description: t.features.webVitalsDesc },
    {
      icon: RiShieldLine,
      title: t.features.envValidation,
      description: t.features.envValidationDesc,
    },
    { icon: RiCloudLine, title: t.features.cloudflare, description: t.features.cloudflareDesc },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-16 p-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold sm:text-5xl">{t.home.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t.home.subtitle}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-lg border bg-card p-6">
            <feature.icon className="h-8 w-8 text-primary" />
            <h3 className="mt-4 font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>{t.home.techStack}</p>
      </div>
    </div>
  );
}
