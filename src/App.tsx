import { Route, Routes } from "react-router-dom";
import RetroWebpage from "./Retro";
import PortfolioChart from "./components/PortfolioChart";
import { investmentData } from "./data";

const portfolioRoutes = [
  { path: "etoro", name: "ETORO", data: investmentData.ETORO },
  { path: "bricksave", name: "BRICKSAVE", data: investmentData.BRICKSAVE },
  { path: "a2censo", name: "A2CENSO", data: investmentData.A2CENSO },
  { path: "trii", name: "TRII", data: investmentData.TRII },
  { path: "xtb", name: "XTB", data: investmentData.XTB },
];
import KanbanBoard from "./components/KanbanBoard";
import Todo from "./components/Todo";
import Resume from "./components/Resume";

function App() {
  return (
    <Routes>
      <Route path="/" element={<RetroWebpage />} />
      {portfolioRoutes.map(({ path, name, data }) => (
        <Route
          key={path}
          path={`/${path}`}
          element={<PortfolioChart platformName={name} investmentData={data} />}
        />
      ))}
      <Route path="/kanban" element={<KanbanBoard />} />
      <Route path="/todo" element={<Todo />} />
      <Route path="/resume" element={<Resume />} />
    </Routes>
  );
}

export default App;
