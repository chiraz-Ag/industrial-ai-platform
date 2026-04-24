import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import { useTheme } from "./hooks/useTheme";
import "./index.css";

function App() {
  const { theme, toggle } = useTheme();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Welcome theme={theme} toggleTheme={toggle} />}
        />
        <Route
          path="/dashboard"
          element={<Dashboard theme={theme} toggleTheme={toggle} />}
        />
        <Route
          path="/login"
          element={
            <div
              style={{
                color: "var(--text)",
                padding: "100px",
                textAlign: "center",
              }}
            >
              Login — coming soon
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div
              style={{
                color: "var(--text)",
                padding: "100px",
                textAlign: "center",
              }}
            >
              Register — coming soon
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
