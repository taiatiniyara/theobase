export interface LWWRegister<T> {
  value: T;
  timestamp: number;
  nodeId: string;
}

export function lwwMerge<T>(a: LWWRegister<T>, b: LWWRegister<T>): LWWRegister<T> {
  if (a.timestamp > b.timestamp) return a;
  if (b.timestamp > a.timestamp) return b;
  return a.nodeId > b.nodeId ? a : b;
}

export function lwwSet<T>(value: T, nodeId: string): LWWRegister<T> {
  return { value, timestamp: Date.now(), nodeId };
}

export class ORSet<T> {
  private added: Map<T, Set<string>> = new Map();
  private removed: Set<string> = new Set();

  add(element: T, tag: string): void {
    const tags = this.added.get(element) || new Set();
    tags.add(tag);
    this.added.set(element, tags);
  }

  remove(element: T, tags: string[]): void {
    const existingTags = this.added.get(element);
    if (!existingTags) return;
    for (const tag of tags) {
      existingTags.delete(tag);
      this.removed.add(tag);
    }
    if (existingTags.size === 0) {
      this.added.delete(element);
    }
  }

  has(element: T): boolean {
    const tags = this.added.get(element);
    if (!tags || tags.size === 0) return false;
    for (const tag of tags) {
      if (!this.removed.has(tag)) return true;
    }
    return false;
  }

  values(): T[] {
    return Array.from(this.added.entries())
      .filter(([_, tags]) => {
        for (const tag of tags) {
          if (!this.removed.has(tag)) return true;
        }
        return false;
      })
      .map(([element]) => element);
  }

  toJSON(): { added: [T, string[]][]; removed: string[] } {
    return {
      added: Array.from(this.added.entries()).map(([k, v]) => [k, Array.from(v)]),
      removed: Array.from(this.removed),
    };
  }

  static fromJSON<T>(data: { added: [T, string[]][]; removed: string[] }): ORSet<T> {
    const set = new ORSet<T>();
    for (const [element, tags] of data.added) {
      set.added.set(element, new Set(tags));
    }
    set.removed = new Set(data.removed);
    return set;
  }
}

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
  const bothEdited = local.version > base.version && remote.version > base.version;
  const differentEditors = local.nodeId !== remote.nodeId;
  if (bothEdited && differentEditors) {
    return { base, ours: local, theirs: remote };
  }
  return null;
}
