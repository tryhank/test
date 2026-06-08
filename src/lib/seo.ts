type SeoOptions = {
  title: string;
  description: string;
  image?: string;
  url?: string;
};

export function seo({ title, description, image, url }: SeoOptions) {
  const tags: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { name: "og:title", content: title },
    { name: "og:description", content: description },
    { name: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (image) {
    tags.push({ name: "og:image", content: image });
    tags.push({ name: "twitter:image", content: image });
  }

  if (url) {
    tags.push({ name: "og:url", content: url });
  }

  return tags;
}
