import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
