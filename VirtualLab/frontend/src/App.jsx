import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Experiments from './pages/Experiments';
import ExperimentDetail from './pages/ExperimentDetail';
import About from './pages/About';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/experiments" element={<Experiments />} />
        <Route path="/experiments/:subject" element={<ExperimentDetail />} />
        <Route path="/experiments/:subject/:experimentId" element={<ExperimentDetail />} />
        <Route path="/about" element={<About />} />
        {/* Fallback route */}
        <Route path="*" element={<Home />} />
      </Routes>
    </MainLayout>
  );
}

export default App;