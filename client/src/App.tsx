import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Orgs from "./pages/Orgs";
import Members from "./pages/Members";
import Finance from "./pages/Finance";
import { getAccessToken, clearTokens } from "./lib/api";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getAccessToken()) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  const [authed, setAuthed] = useState(!!getAccessToken());

  useEffect(() => {
    setAuthed(!!getAccessToken());
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {authed && (
          <nav className="bg-indigo-700 text-white p-4 flex justify-between items-center">
            <span className="font-bold text-lg">Theobase</span>
            <div className="flex gap-4 items-center">
              <a href="/orgs" className="text-sm hover:underline">
                Orgs
              </a>
              <a href="/members" className="text-sm hover:underline">
                Members
              </a>
              <a href="/finance" className="text-sm hover:underline">
                Finance
              </a>
              <button
                onClick={() => {
                  clearTokens();
                  setAuthed(false);
                }}
                className="text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-500"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
        <Routes>
          <Route
            path="/login"
            element={<Login onLogin={() => setAuthed(true)} />}
          />
          <Route
            path="/orgs"
            element={
              <ProtectedRoute>
                <Orgs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <Finance />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={authed ? "/orgs" : "/login"} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
