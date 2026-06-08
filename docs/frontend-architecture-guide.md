# Frontend Architecture Guide

## 目录结构

```text
src/
├── routes/                        # 文件路由（TanStack Router 自动生成路由树）
│   ├── __root.tsx                 # 根布局（html、head、Provider 层级）
│   ├── index.tsx                  # 首页 /
│   └── [module].tsx               # 功能页面（或 [module]/ 目录嵌套路由）
├── components/                    # 全局共享组件
│   ├── ui/                        # shadcn/ui（CLI 生成，勿手动改）
│   ├── header.tsx                 # 响应式导航
│   ├── footer.tsx                 # 页脚
│   ├── theme-provider.tsx         # 主题 Provider
│   ├── theme-toggle.tsx           # 主题切换
│   ├── i18n-provider.tsx          # 国际化 Provider
│   ├── language-switcher.tsx      # 语言切换
│   ├── web-vitals.tsx             # 性能监控（不渲染 UI）
│   ├── default-catch-boundary.tsx # 全局错误边界
│   └── default-not-found.tsx      # 全局 404
├── lib/                           # 工具 & 配置
│   ├── utils.ts                   # cn() 等通用工具
│   ├── seo.ts                     # SEO meta 标签生成
│   ├── i18n/index.ts              # i18n 核心（locale、context、hooks）
│   ├── stores/                    # Zustand stores（按需创建）
│   ├── services/                  # API 调用封装（按需创建）
│   └── validators/                # Zod schema（按需创建）
├── env/                           # 环境变量验证
│   ├── client.ts                  # 客户端变量（VITE_ 前缀）
│   └── server.ts                  # 服务端变量
├── locales/                       # i18n 翻译文件
│   ├── en.ts
│   └── zh.ts
├── router.tsx                     # Router 实例配置
├── routeTree.gen.ts               # 自动生成，勿手动编辑
└── styles.css                     # Tailwind v4 + CSS 变量主题
```

## 路由规范

### 文件路由映射

TanStack Router 使用**文件路由**，`src/routes/` 下的文件自动映射为路由：

| 文件                       | 路由        | 说明               |
| -------------------------- | ----------- | ------------------ |
| `routes/index.tsx`         | `/`         | 首页               |
| `routes/about.tsx`         | `/about`    | 普通页面           |
| `routes/blog/index.tsx`    | `/blog`     | 目录路由           |
| `routes/blog/$postId.tsx`  | `/blog/:id` | 动态参数           |
| `routes/_layout/route.tsx` | —           | 布局路由（无路径） |
| `routes/$.tsx`             | `/*`        | 通配路由           |

### 路由文件结构

每个路由文件必须导出 `Route`：

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  // SEO：每个路由都应配置 head
  head: () => ({
    meta: [...seo({ title: "About | TanStack Starter", description: "..." })],
  }),

  // 数据加载（SSR 期间执行）
  loader: async () => {
    return fetchData();
  },

  // 路由级错误处理（可选，有全局默认）
  errorComponent: MyErrorBoundary,

  // 页面组件
  component: AboutPage,
});

function AboutPage() {
  const data = Route.useLoaderData();
  return <div>{/* ... */}</div>;
}
```

## 数据获取

### 优先级

1. **Route `loader`** — SSR 期间执行，数据随 HTML 返回，无瀑布流
2. **TanStack Query** — 客户端缓存 & 后台刷新，适合频繁变化的数据
3. **Server Functions** — `createServerFn()` 创建，用于表单提交和数据变更

### loader + TanStack Query 集成

```tsx
import { queryOptions } from "@tanstack/react-query";

const postsQueryOptions = queryOptions({
  queryKey: ["posts"],
  queryFn: () => fetchPosts(),
});

export const Route = createFileRoute("/posts")({
  loader: ({ context }) => {
    // 在 loader 中预取，SSR 期间数据可用
    return context.queryClient.ensureQueryData(postsQueryOptions);
  },
  component: PostsPage,
});

function PostsPage() {
  // 组件内用 useSuspenseQuery 消费，自动享受缓存和后台更新
  const { data } = useSuspenseQuery(postsQueryOptions);
}
```

### Server Functions

```tsx
import { createServerFn } from "@tanstack/react-start";

const submitForm = createServerFn({ method: "POST" })
  .validator((data: unknown) => formSchema.parse(data))
  .handler(async ({ data }) => {
    // 服务端逻辑
    return { success: true };
  });
```

## i18n

### 使用方式

```tsx
import { useTranslations } from "@/lib/i18n";

function MyComponent() {
  const { t, locale } = useTranslations();
  return <h1>{t.common.home}</h1>;
}
```

### 添加新语言

1. 创建翻译文件 `src/locales/{code}.ts`，结构与 `en.ts` 保持一致
2. 注册到 `src/lib/i18n/index.ts`：

   ```typescript
   import ja from "@/locales/ja";
   export const locales = ["en", "zh", "ja"] as const;
   const messages: Record<Locale, DeepStringify<typeof en>> = { en, zh, ja };
   ```

3. 添加标签到 `src/components/language-switcher.tsx`：

   ```typescript
   const localeLabels: Record<Locale, string> = {
     en: "English",
     zh: "中文",
     ja: "日本語",
   };
   ```

### 翻译文件规范

按**功能域**组织 key，不要扁平化：

```typescript
export default {
  common: { ... },     // 通用（导航、按钮文本、错误提示）
  home: { ... },       // 首页专属
  features: { ... },   // 特性介绍
  footer: { ... },     // 页脚
} as const;            // 必须 as const，保证类型推导
```

## 环境变量

| 前缀    | 范围            | 安全性                        |
| ------- | --------------- | ----------------------------- |
| `VITE_` | 服务端 + 客户端 | **会打包进 JS**，禁放敏感信息 |
| 无前缀  | 仅服务端        | 安全，可放 API Key / Secret   |

所有变量通过 `src/env/` 集中用 Zod 校验。新增变量必须：

1. 添加到对应的 `env/client.ts` 或 `env/server.ts`
2. 更新 `.env.example`

环境文件优先级：`.env`（开发）> `.env.example`（文档）。`.env` 已 gitignore。

> **Cloudflare Workers 注意：** Workers 无 `process.env`，部署时使用 `wrangler.jsonc` 中的 `vars` 或 `wrangler secret put`。

## 主题系统

三种模式：Light（默认）、Dark、System。

- CSS 变量定义在 `src/styles.css`，使用 oklch 色彩空间
- `ThemeProvider` 通过 `localStorage` 持久化用户选择
- `ScriptOnce` 在 HTML 解析阶段应用主题，避免 FOUC
- 在 `<html>` 标签上切换 `class="dark"`

修改配色：编辑 `src/styles.css` 中的 `:root` 和 `.dark` CSS 变量。

## SEO

每个路由**必须**配置 `head` 属性：

```tsx
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      ...seo({
        title: "About | TanStack Starter",
        description: "About page description",
        image: "https://example.com/og.png", // 可选
        url: "https://example.com/about", // 可选
      }),
    ],
  }),
});
```

`seo()` 函数自动生成 `<title>`、`description`、Open Graph、Twitter Card 标签。

## 组件规范

### 放置原则

| 场景           | 位置                                  |
| -------------- | ------------------------------------- |
| 多页面共享     | `src/components/`                     |
| shadcn/ui 组件 | `src/components/ui/`（CLI 管理）      |
| 单路由私有     | 路由文件内的局部组件或 `_components/` |
| 不确定         | 先写在路由文件内，需复用时再提升      |

### 组件结构

```tsx
// 1. 导入
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

// 2. 类型（如果需要）
type Props = { readonly title: string };

// 3. 组件
export function MyComponent({ title }: Props) {
  const { t } = useTranslations();
  return <div>{title}</div>;
}
```

## 文件命名

| 类型     | 命名规则   | 示例                            |
| -------- | ---------- | ------------------------------- |
| 文件名   | kebab-case | `theme-toggle.tsx`              |
| 组件导出 | PascalCase | `export function ThemeToggle()` |
| 函数导出 | camelCase  | `export function useTheme()`    |
| 常量导出 | UPPER_CASE | `export const DEFAULT_LOCALE`   |
| 类型导出 | PascalCase | `export type Locale`            |

## 错误处理

### 三层防护

1. **全局兜底** — `router.tsx` 中配置 `defaultErrorComponent` 和 `defaultNotFoundComponent`
2. **路由级别** — 单个路由可覆盖 `errorComponent` 和 `notFoundComponent`
3. **组件级别** — 用 React `ErrorBoundary` 包裹风险区域

### 加载状态

路由配置 `pendingComponent` 实现骨架屏：

```tsx
export const Route = createFileRoute("/posts")({
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: PostsPage,
});
```

## 性能

- **Web Vitals** 已内置（`WebVitals` 组件），开发环境 console 输出
- **预加载** — Router 默认 `defaultPreload: "intent"`，鼠标悬停即预加载
- **React Compiler** 已启用，自动 memoize
- **代码分割** — 每个路由文件天然 lazy load
- **TanStack Query** — `staleTime: 2min`，减少重复请求

## 新功能 Checklist

1. 路由文件 `src/routes/[module].tsx`，配置 `head`（SEO）
2. 翻译 key 添加到 `src/locales/en.ts` + `src/locales/zh.ts`
3. 共享组件提取到 `src/components/`（按需）
4. API 服务封装到 `src/lib/services/`（按需）
5. 环境变量注册到 `src/env/` + `.env.example`（按需）
6. 导航链接更新 `src/components/header.tsx`
7. 验证：`pnpm check && pnpm type-check && pnpm build`
