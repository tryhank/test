import { useEffect } from "react";
import type { Metric } from "web-vitals";

function reportMetric(metric: Metric) {
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}`);
    return;
  }

  // Production: send to your analytics endpoint
  // navigator.sendBeacon("/api/vitals", JSON.stringify(metric));
}

export function WebVitals() {
  useEffect(() => {
    import("web-vitals").then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      onCLS(reportMetric);
      onFCP(reportMetric);
      onINP(reportMetric);
      onLCP(reportMetric);
      onTTFB(reportMetric);
    });
  }, []);

  return null;
}
