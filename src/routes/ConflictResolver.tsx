import { useConflictState } from "../lib/useSync";

export default function ConflictResolver() {
  const { conflict, resolveWithLocal, resolveWithServer } = useConflictState();

  if (!conflict) return null;

  const localPayload = JSON.parse(conflict.op.payload) as Record<string, unknown>;
  const serverData = conflict.serverData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 text-red-600">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h2 className="text-lg font-semibold">Edit Conflict Detected</h2>
            <p className="text-sm text-gray-600">
              Member record was edited by another user while you were offline. Choose which version
              to keep.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <h3 className="text-sm font-semibold text-orange-800">Your Changes (Local)</h3>
            <p className="text-xs text-orange-600">Version {conflict.localVersion}</p>
            <DiffView local={localPayload} server={serverData} />
            <button
              onClick={resolveWithLocal}
              className="mt-3 w-full rounded bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Keep My Changes
            </button>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-800">Server Version</h3>
            <p className="text-xs text-blue-600">Version {conflict.serverVersion}</p>
            <DiffView local={serverData} server={localPayload} />
            <button
              onClick={resolveWithServer}
              className="mt-3 w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Keep Server Version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffView({
  local,
  server,
}: {
  local: Record<string, unknown>;
  server: Record<string, unknown>;
}) {
  const allKeys = new Set([...Object.keys(local), ...Object.keys(server)]);
  const skipKeys = new Set(["version", "updatedAt", "updated_at", "id", "created_at"]);

  return (
    <div className="mt-2 space-y-1 text-xs max-h-64 overflow-y-auto">
      {[...allKeys]
        .filter((k) => !skipKeys.has(k))
        .map((key) => {
          const localVal = local[key];
          const serverVal = server[key];
          const changed = JSON.stringify(localVal) !== JSON.stringify(serverVal);
          return (
            <div key={key} className={changed ? "bg-yellow-100 rounded px-1" : ""}>
              <span className="font-medium capitalize">{key.replace(/_/g, " ")}</span>:{" "}
              {changed ? (
                <span>
                  <span className="line-through text-red-500">{String(serverVal ?? "-")}</span>
                  {" → "}
                  <span className="text-green-600">{String(localVal ?? "-")}</span>
                </span>
              ) : (
                <span>{String(localVal ?? "-")}</span>
              )}
            </div>
          );
        })}
    </div>
  );
}
