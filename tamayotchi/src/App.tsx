import { Route, Routes } from "react-router-dom";
import RetroWebpage from "./Retro";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<RetroWebpage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
