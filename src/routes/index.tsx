import {
  RiDeleteBin6Line,
  RiLoginCircleLine,
  RiLogoutCircleLine,
  RiRefreshLine,
  RiSave3Line,
} from "@remixicon/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { seo } from "@/lib/seo";

const REFRESH_INTERVAL_MS = 20_000;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      ...seo({
        title: "足球数据工作台",
        description: "实时足球数据、保存项追踪和服务器定时同步。",
      }),
    ],
  }),
  component: HomePage,
});

type User = {
  id: number;
  username: string;
};

type OddsRow = {
  label: string;
  h: string;
  d: string;
  a: string;
  isSelectedLine: boolean;
  highlightH: boolean;
  highlightD: boolean;
  highlightA: boolean;
};

type FootballRow = {
  id?: number;
  savedId?: number;
  matchId: string;
  uniqueKey: string;
  typeText: string;
  matchNum: string;
  matchTime: string;
  jcLeague: string;
  hgLeague: string;
  home: string;
  away: string;
  updateTime: string;
  jcOdds: OddsRow[] | null;
  platformOdds: OddsRow[] | null;
  profit: string;
  profitRate: string;
  profitClass: string;
  rateClass: string;
};

type LiveResponse = {
  snapshotId: number | null;
  capturedAt: string | null;
  rows: FootballRow[];
};

type SavedRecord = {
  id: number;
  savedAt: string;
  updatedAt: string;
  matchId: string | null;
  uniqueKey: string;
  row: FootballRow;
};

type SavedRecordNotification = {
  type: "saved_record_updated";
  savedRecordId: number;
  message: string;
  createdAt: string;
  row: FootballRow;
};

function notificationWebSocketUrl() {
  const configuredUrl = import.meta.env.VITE_WS_URL as string | undefined;
  if (configuredUrl) return configuredUrl;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const port = window.location.port ? String(Number(window.location.port) + 1) : "";
  const host = port ? `${window.location.hostname}:${port}` : window.location.host;
  return `${protocol}//${host}/ws/notifications`;
}

async function apiJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: options?.body ? { "content-type": "application/json" } : undefined,
    ...options,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `请求失败：${response.status}`);
  }
  return data as T;
}

function useSession() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiJson<{ user: User | null }>("/api/auth/me"),
    retry: false,
    refetchOnWindowFocus: true,
  });
}

function LoginPanel() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: () =>
      apiJson<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    onSuccess: async () => {
      toast.success("登录成功");
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto flex min-h-[calc(100svh-7rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>足球数据工作台</CardTitle>
          <p className="text-sm text-muted-foreground">登录后查看实时数据和你的保存项。</p>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              login.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="username">账号</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              <RiLoginCircleLine />
              {login.isPending ? "登录中" : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function HomePage() {
  const session = useSession();

  if (session.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">
        正在检查登录状态...
      </div>
    );
  }

  if (!session.data?.user) return <LoginPanel />;

  return <FootballWorkspace user={session.data.user} />;
}

function FootballWorkspace({ user }: { readonly user: User }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"live" | "saved">("live");
  const [highlightedSavedId, setHighlightedSavedId] = useState<number | null>(null);

  const liveQuery = useQuery({
    queryKey: ["live"],
    queryFn: () => apiJson<LiveResponse>("/api/live"),
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: false,
  });

  const savedQuery = useQuery({
    queryKey: ["saved"],
    queryFn: () => apiJson<SavedRecord[]>("/api/saved"),
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: false,
  });

  const savedKeys = useMemo(
    () => new Set((savedQuery.data || []).map((item) => item.uniqueKey)),
    [savedQuery.data],
  );

  const sync = useMutation({
    mutationFn: () =>
      apiJson<{ snapshotId: number; rows: number; updatedSavedRecords: number }>("/api/sync", {
        method: "POST",
      }),
    onSuccess: async (result) => {
      toast.success(`同步完成：${result.rows} 条数据`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["live"] }),
        queryClient.invalidateQueries({ queryKey: ["saved"] }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });

  const logout = useMutation({
    mutationFn: () => apiJson<{ ok: true }>("/api/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  const saveRecord = useMutation({
    mutationFn: (row: FootballRow) =>
      apiJson<{ id: number }>("/api/saved", {
        method: "POST",
        body: JSON.stringify(row),
      }),
    onSuccess: async (result, row) => {
      queryClient.setQueryData<SavedRecord[]>(["saved"], (current = []) => [
        {
          id: result.id,
          savedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          matchId: row.matchId,
          uniqueKey: row.uniqueKey,
          row,
        },
        ...current,
      ]);
      toast.success("已保存");
      await queryClient.invalidateQueries({ queryKey: ["saved"] });
    },
    onError: (error) => {
      if (error.message.includes("duplicate")) {
        toast.info("这条数据已经保存过");
        void queryClient.invalidateQueries({ queryKey: ["saved"] });
      } else {
        toast.error(error.message);
      }
    },
  });
  const savingKey = saveRecord.variables?.uniqueKey;

  const deleteRecord = useMutation({
    mutationFn: (id: number) => apiJson<{ ok: true }>(`/api/saved/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("已删除");
      await queryClient.invalidateQueries({ queryKey: ["saved"] });
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    let reconnectTimer: number | null = null;
    let highlightTimer: number | null = null;
    let closed = false;
    let socket: WebSocket | null = null;

    const connect = () => {
      socket = new WebSocket(notificationWebSocketUrl());
      socket.addEventListener("message", (event) => {
        const notification = JSON.parse(event.data) as Partial<SavedRecordNotification>;
        if (notification.type !== "saved_record_updated" || !notification.savedRecordId) return;

        toast.info(notification.message || "保存数据已更新");
        setHighlightedSavedId(notification.savedRecordId);
        void queryClient.invalidateQueries({ queryKey: ["saved"] });

        if (highlightTimer) window.clearTimeout(highlightTimer);
        highlightTimer = window.setTimeout(() => setHighlightedSavedId(null), 3500);
      });
      socket.addEventListener("close", () => {
        if (closed) return;
        reconnectTimer = window.setTimeout(connect, 3000);
      });
    };

    connect();

    return () => {
      closed = true;
      socket?.close();
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (highlightTimer) window.clearTimeout(highlightTimer);
    };
  }, [queryClient, user.id]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 px-4 py-6">
      <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">足球数据工作台</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">当前用户：{user.username}</Badge>
            <Badge variant={liveQuery.data?.capturedAt ? "success" : "secondary"}>
              最新同步：{liveQuery.data?.capturedAt || "暂无"}
            </Badge>
            <Badge variant="secondary">保存项：{savedQuery.data?.length || 0}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            <TabsTrigger active={tab === "live"} onClick={() => setTab("live")}>
              实时数据
            </TabsTrigger>
            <TabsTrigger active={tab === "saved"} onClick={() => setTab("saved")}>
              我的保存
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RiRefreshLine />
            {sync.isPending ? "同步中" : "手动同步"}
          </Button>
          <Button variant="ghost" onClick={() => logout.mutate()} disabled={logout.isPending}>
            <RiLogoutCircleLine />
            退出
          </Button>
        </div>
      </div>

      {tab === "live" ? (
        <DataPanel
          title="实时数据"
          status={
            liveQuery.isError
              ? liveQuery.error.message
              : `共 ${liveQuery.data?.rows.length || 0} 条`
          }
          rows={liveQuery.data?.rows || []}
          loading={liveQuery.isLoading}
          errorText={liveQuery.isError ? liveQuery.error.message : null}
          emptyText="暂无实时数据，请点击手动同步或等待定时任务。"
          action={(row) => (
            <Button
              size="sm"
              variant={savedKeys.has(row.uniqueKey) ? "secondary" : "default"}
              disabled={
                savedKeys.has(row.uniqueKey) ||
                (saveRecord.isPending && savingKey === row.uniqueKey)
              }
              onClick={() => saveRecord.mutate(row)}
            >
              <RiSave3Line />
              {savedKeys.has(row.uniqueKey) ? "已保存" : "保存"}
            </Button>
          )}
        />
      ) : (
        <DataPanel
          title="我的保存"
          status={
            savedQuery.isError ? savedQuery.error.message : `共 ${savedQuery.data?.length || 0} 条`
          }
          rows={(savedQuery.data || []).map((item, index) => ({
            ...item.row,
            id: index,
            savedId: item.id,
          }))}
          loading={savedQuery.isLoading}
          errorText={savedQuery.isError ? savedQuery.error.message : null}
          emptyText="暂无已保存数据。"
          highlightedSavedId={highlightedSavedId}
          action={(row) => (
            <Button
              size="sm"
              variant="destructive"
              disabled={!row.savedId || deleteRecord.isPending}
              onClick={() => row.savedId && deleteRecord.mutate(row.savedId)}
            >
              <RiDeleteBin6Line />
              删除
            </Button>
          )}
        />
      )}
    </div>
  );
}

function DataPanel({
  title,
  status,
  rows,
  loading,
  errorText,
  emptyText,
  highlightedSavedId,
  action,
}: {
  readonly title: string;
  readonly status: string;
  readonly rows: FootballRow[];
  readonly loading: boolean;
  readonly errorText?: string | null;
  readonly emptyText: string;
  readonly highlightedSavedId?: number | null;
  readonly action: (row: FootballRow) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <span className="text-sm text-muted-foreground">{loading ? "加载中..." : status}</span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/60 text-left">
                <th className="w-24 px-3 py-2 font-medium">类型</th>
                <th className="w-64 px-3 py-2 font-medium">赛事</th>
                <th className="px-3 py-2 font-medium">JC投注</th>
                <th className="px-3 py-2 font-medium">平台投注</th>
                <th className="w-24 px-3 py-2 text-center font-medium">利润</th>
                <th className="w-28 px-3 py-2 text-center font-medium">利润率</th>
                <th className="w-28 px-3 py-2 text-center font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={
                      errorText
                        ? "px-3 py-10 text-center text-destructive"
                        : "px-3 py-10 text-center text-muted-foreground"
                    }
                  >
                    {loading ? "正在加载..." : errorText || emptyText}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={`${row.uniqueKey}-${row.savedId || row.id}`}
                    className={
                      row.savedId && row.savedId === highlightedSavedId
                        ? "border-b bg-emerald-500/10 transition-colors"
                        : "border-b transition-colors hover:bg-muted/30"
                    }
                  >
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium">{row.matchNum}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{row.typeText}</div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <MatchSummary row={row} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <OddsTable rows={row.jcOdds} labels={{ h: "胜", d: "平", a: "负" }} />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <OddsTable
                        rows={row.platformOdds}
                        labels={{ h: row.home, d: "和局", a: row.away }}
                      />
                    </td>
                    <td className="px-3 py-3 text-center align-top font-semibold">{row.profit}</td>
                    <td
                      className={
                        row.rateClass === "positive"
                          ? "px-3 py-3 text-center align-top font-semibold text-emerald-600"
                          : row.rateClass === "negative"
                            ? "px-3 py-3 text-center align-top font-semibold text-destructive"
                            : "px-3 py-3 text-center align-top font-semibold"
                      }
                    >
                      {row.profitRate}
                    </td>
                    <td className="px-3 py-3 text-center align-top">{action(row)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchSummary({ row }: { readonly row: FootballRow }) {
  return (
    <div className="space-y-1 leading-tight">
      <div className="text-xs text-muted-foreground">{row.matchTime}</div>
      <div className="font-medium">
        <span className="text-destructive">{row.home}</span>
        <span className="px-1 text-muted-foreground">VS</span>
        <span className="text-primary">{row.away}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline">JC {row.jcLeague}</Badge>
        <Badge variant="outline">平台 {row.hgLeague}</Badge>
      </div>
      <div className="text-xs text-muted-foreground">更新：{row.updateTime}</div>
    </div>
  );
}

function OddsTable({
  rows,
  labels,
}: {
  readonly rows: OddsRow[] | null;
  readonly labels: { h: string; d: string; a: string };
}) {
  if (!rows?.length) return <div className="text-sm text-muted-foreground">无数据</div>;

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="grid grid-cols-4 bg-muted/70 text-center text-xs font-medium">
        <div className="px-2 py-1 text-left">投注类型</div>
        <div className="px-2 py-1">{labels.h}</div>
        <div className="px-2 py-1">{labels.d}</div>
        <div className="px-2 py-1">{labels.a}</div>
      </div>
      {rows.map((row) => (
        <div
          key={row.label}
          className={
            row.isSelectedLine
              ? "grid grid-cols-4 border-t bg-sky-500/10 text-center text-xs"
              : "grid grid-cols-4 border-t text-center text-xs"
          }
        >
          <div className="px-2 py-1 text-left">{row.label}</div>
          <OddsValue active={row.highlightH}>{row.h}</OddsValue>
          <OddsValue active={row.highlightD}>{row.d}</OddsValue>
          <OddsValue active={row.highlightA}>{row.a}</OddsValue>
        </div>
      ))}
    </div>
  );
}

function OddsValue({
  active,
  children,
}: {
  readonly active: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <div
      className={
        active ? "px-2 py-1 font-semibold text-amber-700 dark:text-amber-300" : "px-2 py-1"
      }
    >
      {children}
    </div>
  );
}
