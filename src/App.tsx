import { Route, Routes } from 'react-router-dom'
import RetroWebpage from './Retro'
import PortfolioChart from './components/PortfolioChart'
import { a2censoData, bricksaveData, etoroData, triiData, xtbData } from './data'

const portfolioRoutes = [
  { path: 'etoro', name: 'ETORO', data: etoroData, currency: 'USD' },
  { path: 'bricksave', name: 'BRICKSAVE', data: bricksaveData, currency: 'USD' },
  { path: 'a2censo', name: 'A2CENSO', data: a2censoData, currency: 'COP' },
  { path: 'trii', name: 'TRII', data: triiData, currency: 'COP' },
  { path: 'xtb', name: 'XTB', data: xtbData, currency: 'USD' },
]
import KanbanBoard from './components/KanbanBoard'
import Todo from './components/Todo'
import Resume from './components/Resume'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RetroWebpage />} />
      {portfolioRoutes.map(({ path, name, data, currency }) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <PortfolioChart
              platformName={name}
              investmentData={data}
              currency={currency}
            />
          }
        />
      ))}
      <Route path="/kanban" element={<KanbanBoard />} />
      <Route path="/todo" element={<Todo />} />
      <Route path="/resume" element={<Resume />} />
    </Routes>
  )
}
export default App
