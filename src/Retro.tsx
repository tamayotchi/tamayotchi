import React, { useState, useEffect } from 'react';
import Todo from './components/Todo';

const RetroWebpage: React.FC = () => {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisitorCount(prevCount => prevCount + 1);
    }, 10000); // Increment every 10 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23404' stroke-width='1'%3E%3Cpath d='M769 229L1037 260.9M927 880L731 737 520 660 309 538 40 599 295 764 126.5 879.5 40 599-197 493 102 382-31 229 126.5 79.5-69-63'/%3E%3Cpath d='M-31 229L237 261 390 382 603 493 308.5 537.5 101.5 381.5M370 905L295 764'/%3E%3Cpath d='M520 660L578 842 731 737 840 599 603 493 520 660 295 764 309 538 390 382 539 269 769 229 577.5 41.5 370 105 295 -36 126.5 79.5 237 261 102 382 40 599 -69 737 127 880'/%3E%3Cpath d='M520-140L578.5 42.5 731-63M603 493L539 269 237 261 370 105M902 382L539 269M390 382L102 382'/%3E%3Cpath d='M-222 42L126.5 79.5 370 105 539 269 577.5 41.5 927 80 769 229 902 382 603 493 731 737M295-36L577.5 41.5M578 842L295 764M40-201L127 80M102 382L-261 269'/%3E%3C/g%3E%3Cg fill='%23505'%3E%3Ccircle cx='769' cy='229' r='5'/%3E%3Ccircle cx='539' cy='269' r='5'/%3E%3Ccircle cx='603' cy='493' r='5'/%3E%3Ccircle cx='731' cy='737' r='5'/%3E%3Ccircle cx='520' cy='660' r='5'/%3E%3Ccircle cx='309' cy='538' r='5'/%3E%3Ccircle cx='295' cy='764' r='5'/%3E%3Ccircle cx='40' cy='599' r='5'/%3E%3Ccircle cx='102' cy='382' r='5'/%3E%3Ccircle cx='127' cy='80' r='5'/%3E%3Ccircle cx='370' cy='105' r='5'/%3E%3Ccircle cx='578' cy='42' r='5'/%3E%3Ccircle cx='237' cy='261' r='5'/%3E%3Ccircle cx='390' cy='382' r='5'/%3E%3C/g%3E%3C/svg%3E")`
    }}>
      <h1 className="text-4xl font-bold mb-2">Tamayotchi.com</h1>
      <h2 className="text-2xl mb-4">Isa te amo</h2>
      
      <div className="bg-yellow-400 text-black p-2 mb-4 inline-block transform -rotate-2">
        <span className="text-xl font-bold">UNDER CONSTRUCTION</span>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-2">My Investment Platforms:</h3>
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
        </ul>
      </div>
      <p className="mb-4">Welcome to my new homepage!</p>
      
      <div className="mb-4">
        <img src="/api/placeholder/100/100" alt="House with newspaper" className="inline-block" />
      </div>
      
      <div className="mb-4">
        <span>You are visitor </span>
        <span className="bg-green-500 text-black px-1">{visitorCount.toString().padStart(7, '0')}</span>
      </div>
      
      <div>
        <img src="/api/placeholder/88/31" alt="W3C HTML 2.0 Verified" className="inline-block" />
      </div>
      
      <div className="mt-8">
        <Todo />
      </div>
    </div>
  );
};

export default RetroWebpage;