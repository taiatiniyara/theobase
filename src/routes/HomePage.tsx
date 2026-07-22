import { useNavigate } from "@tanstack/react-router";

export default function HomePage() {
  const navigate = useNavigate();

  const hasToken =
    typeof window !== "undefined" &&
    (localStorage.getItem("accessToken") || localStorage.getItem("refreshToken"));

  if (hasToken) {
    navigate({ to: "/app" });
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <img src="/icon.svg" alt="Theobase" className="mx-auto mb-4 h-12 w-auto" />
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">Theobase</h1>
        <p className="text-center text-gray-600">
          Seventh-day Adventist Church Administration Platform
        </p>
        <div className="mt-8 space-y-4">
          <a
            href="/login"
            className="block w-full rounded-md bg-orange-500 px-4 py-2 text-center text-white hover:bg-orange-600"
          >
            Sign In
          </a>
          <a
            href="/signup"
            className="block w-full rounded-md border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
          >
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
}
