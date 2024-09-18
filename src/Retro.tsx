import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function RetroWebpage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`font-mono ${isDarkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-800'} min-h-screen transition-colors duration-300 relative`}>
      <div 
        className={`absolute inset-0 ${isDarkMode ? 'opacity-10' : 'opacity-5'}`} 
        style={{
          backgroundImage: `
            linear-gradient(to right, ${isDarkMode ? '#374151' : '#9CA3AF'} 1px, transparent 1px),
            linear-gradient(to bottom, ${isDarkMode ? '#374151' : '#9CA3AF'} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      <div className="max-w-4xl mx-auto p-4 relative z-10">
        <div className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} p-4`}>
          <header className="mb-8 relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-0 right-0"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
            <h1 className="text-2xl font-bold mb-2">TAMAYOTCHI</h1>
            <p className="mb-4"></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>Version: v0.1.0</p>
                <p>Updated: 18/09/2024</p>
              </div>
              <div>
                <p>Author: Juan Tamayo</p>
                <p>Visitor Count: 8</p>
              </div>
            </div>
          </header>

          <div className={`text-center py-4 mb-8 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} role="alert">
            <p className="text-lg font-bold">
              [UNDER CONSTRUCTION]
            </p>
          </div>

          <nav className="mb-8">
            <h2 className="text-xl font-bold mb-2">CONTENTS</h2>
            <ul className="list-disc list-inside">
              <li>
                <a href="/etoro" className="text-blue-400 hover:text-blue-300 underline">eToro Portfolio</a>
              </li>
              <li>
                <a href="/a2censo" className="text-blue-400 hover:text-blue-300 underline">A2Censo Portfolio</a>
              </li>
              <li>
                <a href="/bricksave" className="text-blue-400 hover:text-blue-300 underline">Bricksave Portfolio</a>
              </li>
              <li>
                <a href="/resume" className="text-blue-400 hover:text-blue-300 underline">View My Resume</a>
              </li>
            </ul>
          </nav>

          <main>
            <section className="mb-8">
              <h2 className="text-xl font-bold mb-2">BLOG</h2>
              <p className="mb-4">
              </p>
              <p>
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
