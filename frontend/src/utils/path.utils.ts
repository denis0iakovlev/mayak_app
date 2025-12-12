type MatchMode = "exact" | "prefix";

export function isActivePath(
  currentPath: string,
  tabPath: string,
  mode: MatchMode = "prefix"
): boolean {
  const normalize = (p: string) =>
    p.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

  const cur = normalize(currentPath);
  const tab = normalize(tabPath);

  if (mode === "exact") return cur === tab;

  if (tab === "/") return cur === "/";

  // prefix + граница сегмента: "/a" матчится "/a" и "/a/...", но не "/ab"
  return cur === tab || cur.startsWith(tab + "/");
}
