export type FootballPayload = {
  JCInfos?: Array<Record<string, unknown> & { matchId?: string }>;
  HGInfos?: Array<Record<string, unknown> & { matchId?: string }>;
  sinData?: Array<FootballRecord>;
  [key: string]: unknown;
};

export type FootballRecord = {
  matchId?: string;
  JCgoalLine?: string;
  HGgoalLine?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

export type FootballRow = {
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

export type OddsRow = {
  label: string;
  h: string;
  d: string;
  a: string;
  isSelectedLine: boolean;
  highlightH: boolean;
  highlightD: boolean;
  highlightA: boolean;
};

function valueOrDash(value: unknown) {
  if (value === undefined || value === null || value === "") return "--";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

function parseRate(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return Number(String(value).replace("%", ""));
  }
  return 0;
}

function buildIndex(items: Array<Record<string, unknown> & { matchId?: string }> = []) {
  return new Map(items.map((item) => [String(item.matchId || ""), item]));
}

function getRowType(record: FootballRecord) {
  const method = valueOrDash(record.data?.method);
  if (method.includes("2")) return "外平手盘";
  if (record.JCgoalLine !== "-" && record.HGgoalLine !== "-") return "内平输一半";
  return "内平手盘";
}

function shouldHighlight(
  record: FootballRecord,
  prefix: "JC" | "HG",
  line: string,
  betKey: string,
) {
  const data = record.data || {};
  return (
    (data[`${prefix}goalLine1`] === line && data[`${prefix}Touz1`] === betKey) ||
    (data[`${prefix}goalLine2`] === line && data[`${prefix}Touz2`] === betKey)
  );
}

function buildUniqueKey(record: FootballRecord) {
  const data = record.data || {};
  return [
    record.matchId,
    data.method,
    data.JCgoalLine1,
    data.JCgoalLine2,
    data.JCTouz1,
    data.JCTouz2,
    data.HGgoalLine1,
    data.HGgoalLine2,
    data.HGTouz1,
    data.HGTouz2,
  ].join("|");
}

function buildJcOdds(record: FootballRecord, jcInfo?: Record<string, unknown>) {
  if (!jcInfo) return null;
  const normalLine = "-";
  const handicapLine = valueOrDash(jcInfo.hhad_goalLine || record.JCgoalLine || "-");
  const rows: OddsRow[] = [];
  const normalRow = {
    label: "胜平负",
    h: valueOrDash(jcInfo.had_h),
    d: valueOrDash(jcInfo.had_d),
    a: valueOrDash(jcInfo.had_a),
    isSelectedLine:
      record.data?.JCgoalLine1 === normalLine || record.data?.JCgoalLine2 === normalLine,
    highlightH: shouldHighlight(record, "JC", normalLine, "h"),
    highlightD: shouldHighlight(record, "JC", normalLine, "d"),
    highlightA: shouldHighlight(record, "JC", normalLine, "a"),
  };
  const hasNormalOdds = [normalRow.h, normalRow.d, normalRow.a].some(
    (value) => value !== "--" && value !== "-",
  );
  if (hasNormalOdds) {
    rows.push(normalRow);
  }

  rows.push({
    label: `让 ${handicapLine}`,
    h: valueOrDash(jcInfo.hhad_h),
    d: valueOrDash(jcInfo.hhad_d),
    a: valueOrDash(jcInfo.hhad_a),
    isSelectedLine:
      record.data?.JCgoalLine1 === handicapLine || record.data?.JCgoalLine2 === handicapLine,
    highlightH: shouldHighlight(record, "JC", handicapLine, "h"),
    highlightD: shouldHighlight(record, "JC", handicapLine, "d"),
    highlightA: shouldHighlight(record, "JC", handicapLine, "a"),
  });

  return rows;
}

function buildPlatformOdds(record: FootballRecord, hgInfo?: Record<string, unknown>) {
  if (!hgInfo) return null;
  const rows: OddsRow[] = [];
  for (let index = 1; index <= 6; index += 1) {
    const line = hgInfo[`hhad_goalLine${index}`];
    if (line && line !== "-") {
      const lineText = valueOrDash(line);
      rows.push({
        label: `让 ${lineText}`,
        h: valueOrDash(hgInfo[`hhad_h${index}`]),
        d: valueOrDash(hgInfo[`hhad_d${index}`]),
        a: valueOrDash(hgInfo[`hhad_a${index}`]),
        isSelectedLine:
          record.data?.HGgoalLine1 === lineText || record.data?.HGgoalLine2 === lineText,
        highlightH: shouldHighlight(record, "HG", lineText, "h"),
        highlightD: shouldHighlight(record, "HG", lineText, "d"),
        highlightA: shouldHighlight(record, "HG", lineText, "a"),
      });
    }
  }
  return rows.length ? rows : null;
}

export function buildFootballRows(data: FootballPayload): FootballRow[] {
  const jcIndex = buildIndex(data.JCInfos);
  const hgIndex = buildIndex(data.HGInfos);
  const records = [...(data.sinData || [])].sort(
    (left, right) => parseRate(right.data?.profitRate) - parseRate(left.data?.profitRate),
  );

  return records.map((record, index) => {
    const jcInfo = jcIndex.get(String(record.matchId || ""));
    const hgInfo = hgIndex.get(String(record.matchId || ""));
    const profit = record.data?.profit;
    const profitRate = record.data?.profitRate;
    return {
      id: index,
      matchId: String(record.matchId || ""),
      uniqueKey: buildUniqueKey(record),
      typeText: getRowType(record),
      matchNum: valueOrDash(jcInfo?.matchNumStr || record.matchId),
      matchTime: valueOrDash(jcInfo?.matchTimeFormat || record.data?.matchTimeFormat),
      jcLeague: valueOrDash(jcInfo?.leagueAbbName || jcInfo?.leagueAllName),
      hgLeague: valueOrDash(hgInfo?.leagueAbbName || hgInfo?.leagueAllName),
      home: valueOrDash(jcInfo?.homeTeamAbbName || hgInfo?.homeTeamAbbName),
      away: valueOrDash(jcInfo?.awayTeamAbbName || hgInfo?.awayTeamAbbName),
      updateTime: valueOrDash(valueOrDash(hgInfo?.updatedAt).replace("T", " ").slice(0, 19)),
      jcOdds: buildJcOdds(record, jcInfo),
      platformOdds: buildPlatformOdds(record, hgInfo),
      profit: valueOrDash(profit),
      profitRate: valueOrDash(profitRate),
      profitClass: Number(profit) > 0 ? "positive" : Number(profit) < 0 ? "negative" : "",
      rateClass:
        parseRate(profitRate) > 0 ? "positive" : parseRate(profitRate) < 0 ? "negative" : "",
    };
  });
}
