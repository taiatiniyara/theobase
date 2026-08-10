export interface DoVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseDoVersion(header: string | null): DoVersion | null {
  if (!header) return null;
  const match = header.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
  };
}

let lastVersion: DoVersion | null = null;

export function checkDoVersion(header: string | null): boolean {
  const version = parseDoVersion(header);
  if (!version) return true;
  if (!lastVersion) {
    lastVersion = version;
    return true;
  }
  if (version.major > lastVersion.major) {
    lastVersion = version;
    return false;
  }
  lastVersion = version;
  return true;
}
