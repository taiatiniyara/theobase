export function getCongregationDO(c: any, congregationId: string): any {
  const ns = c.env.CONGREGATION_DO;
  if (!ns) return null;
  const id = ns.idFromName(congregationId);
  return ns.get(id);
}
