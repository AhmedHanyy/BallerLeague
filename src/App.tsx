/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ResultsAnalytics } from './pages/ResultsAnalytics';
import { Overview } from './pages/Overview';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          <Header />
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/results" element={<ResultsAnalytics />} />
            <Route path="/standings" element={<ResultsAnalytics />} /> {/* Reusing for now */}
            <Route path="*" element={<Overview />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
