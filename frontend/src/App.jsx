import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "./lib/supabase";

import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { useTheme } from "./hooks/useTheme";
import "./index.css";

function GoogleTokenHandler() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem("token", session.access_token);
        window.history.replaceState({}, document.title, "/dashboard");
      }
    });
  }, []);

  return null;
}

function App() {
  const { theme, toggle } = useTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome theme={theme} toggleTheme={toggle} />} />

        <Route path="/dashboard" element={
          <>
            <GoogleTokenHandler />
            <Dashboard theme={theme} toggleTheme={toggle} />
          </>
        } />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;