export default function ReportsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
      <div className="mt-6 rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-3 text-lg font-medium text-gray-900">Quarterly & Annual Reports</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Combined membership + finance reports for business meetings. Monthly treasurer reports are
          available from the Finance page.
        </p>
      </div>
    </div>
  );
}
