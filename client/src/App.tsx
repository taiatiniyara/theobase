import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Orgs from "./pages/Orgs";
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
            <button
              onClick={() => {
                clearTokens();
                setAuthed(false);
              }}
              className="text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-500"
            >
              Logout
            </button>
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
            path="*"
            element={<Navigate to={authed ? "/orgs" : "/login"} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
