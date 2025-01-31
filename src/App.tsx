import { Route, Routes } from 'react-router-dom'
import RetroWebpage from './Retro'
import PortfolioChart from './components/PortfolioChart'
import { a2censoData, bricksaveData, etoroData, triiData } from './data'
import KanbanBoard from './components/KanbanBoard'
import Todo from './components/Todo'
import Resume from './components/Resume'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RetroWebpage />} />
      <Route path="/etoro" element={
        <PortfolioChart
          platformName="ETORO"
          investmentData={etoroData}
          currency="USD"
        />
      } />
      <Route path="/bricksave" element={
        <PortfolioChart
          platformName="BRICKSAVE"
          investmentData={bricksaveData}
          currency="USD"
        />
      } />
      <Route path="/a2censo" element={
        <PortfolioChart
          platformName="A2CENSO"
          investmentData={a2censoData}
          currency="COP"
        />
      } />
      <Route path="/trii" element={
        <PortfolioChart
          platformName="TRII"
          investmentData={triiData}
          currency="COP"
        />
      } />
      <Route path="/kanban" element={<KanbanBoard />} />
      <Route path="/todo" element={<Todo />} />
      <Route path="/resume" element={<Resume />} />
    </Routes>
  )
}
export default App
