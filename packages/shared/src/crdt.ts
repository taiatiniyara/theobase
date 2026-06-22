export interface RevisionFork<T> {
  base: { version: number; content: T };
  ours: { version: number; content: T; nodeId: string };
  theirs: { version: number; content: T; nodeId: string };
}

export function detectRevisionFork<T>(
  base: { version: number; content: T },
  local: { version: number; content: T; nodeId: string },
  remote: { version: number; content: T; nodeId: string }
): RevisionFork<T> | null {
  const bothEdited =
    local.version > base.version && remote.version > base.version;
  const differentEditors = local.nodeId !== remote.nodeId;
  if (bothEdited && differentEditors) {
    return { base, ours: local, theirs: remote };
  }
  return null;
}
