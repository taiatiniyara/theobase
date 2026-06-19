export function isDuringSabbathHours(timezone: string): boolean {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekday = parts.find(p => p.type === "weekday")?.value || "";
    const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);

    if (weekday === "Fri" && hour >= 18) return true;
    if (weekday === "Sat" && hour < 18) return true;

    return false;
  } catch {
    return false;
  }
}
