import { Route, Routes } from "react-router-dom";
import RetroWebpage from "./Retro";
import PortfolioChart from "./components/PortfolioChart";
import { investmentData } from "./data";
import BlogList from "./components/BlogList";
import BlogPost from "./components/BlogPost";
import Resume from "./components/Resume";
import { ThemeProvider } from "./contexts/ThemeContext";

const portfolioRoutes = [
  { path: "etoro", name: "ETORO", data: investmentData.ETORO },
  { path: "bricksave", name: "BRICKSAVE", data: investmentData.BRICKSAVE },
  { path: "a2censo", name: "A2CENSO", data: investmentData.A2CENSO },
  { path: "trii", name: "TRII", data: investmentData.TRII },
  { path: "xtb", name: "XTB", data: investmentData.XTB },
];

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<RetroWebpage />} />
        {portfolioRoutes.map(({ path, name, data }) => (
          <Route
            key={path}
            path={`/${path}`}
            element={<PortfolioChart platformName={name} investmentData={data} />}
          />
        ))}
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/resume" element={<Resume />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
