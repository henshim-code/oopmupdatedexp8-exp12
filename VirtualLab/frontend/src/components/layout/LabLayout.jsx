import React from 'react';
import Sidebar from './Sidebar';

export default function LabLayout({ 
  activeSection, 
  setActiveSection, 
  experiments = [], 
  currentExperimentId, 
  onSelectExperiment,
  sidebarOpen,
  setSidebarOpen,
  children
}) {
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto flex">
      {/* Slide Bar Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        experiments={experiments}
        currentExperimentId={currentExperimentId}
        onSelectExperiment={onSelectExperiment}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
