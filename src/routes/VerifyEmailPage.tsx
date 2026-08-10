import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";

export default function VerifyEmailPage() {
  const { token } = useSearch({ from: "/verify-email" });
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided. Please use the link from your email.");
      return;
    }

    async function verify() {
      try {
        const apiBase = window.location.origin;
        const res = await fetch(`${apiBase}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message ?? "Email verified successfully.");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Unable to connect. Please check your internet connection and try again.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        <img src="/icon.svg" alt="Theobase" className="mx-auto mb-4 h-10 w-auto" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Email Verification</h1>

        {status === "verifying" && (
          <div className="mt-6">
            <Spinner className="mx-auto mb-4" />
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
              <span className="text-2xl text-success-text">✓</span>
            </div>
            <p className="text-sm text-gray-600">{message}</p>
            <Button className="mt-6" onClick={() => (window.location.href = "/login")}>
              Go to Login
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg">
              <span className="text-2xl text-danger-text">✕</span>
            </div>
            <p className="text-sm text-danger-text">{message}</p>
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => (window.location.href = "/login")}
            >
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
