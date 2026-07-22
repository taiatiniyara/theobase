import { useState, type FormEvent } from "react";
import { authApi } from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Request failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Check Your Email</h1>
          <p className="text-gray-600">
            If an account with that email exists, a password reset link has been sent.
          </p>
          <a href="/login" className="mt-6 inline-block text-orange-500 hover:text-orange-600">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <img src="/icon.svg" alt="Theobase" className="mx-auto mb-4 h-10 w-auto" />
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">Theobase</h1>
        <p className="mb-6 text-center text-sm text-gray-600">Reset your password</p>
        {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <a href="/login" className="text-orange-500 hover:text-orange-600">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
