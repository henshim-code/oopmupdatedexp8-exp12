import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import daaData from '../../data/daa/daa.json';
import mlData from '../../data/ml/ml.json';
import oopmData from '../../data/oopm/oopm.json';
import { 
  Target, 
  BookOpen, 
  FileText, 
  Cpu,
  HelpCircle,
  BarChart3, 
  CheckCircle2, 
  ChevronRight,
  ListOrdered,
  Layers,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeSection, 
  setActiveSection, 
  experiments = [], 
  currentExperimentId, 
  onSelectExperiment,
  isOpen,
  onClose
}) {
  const navigate = useNavigate();

  // Subject Mapping for Sidebar Dropdown
  const subjectsMap = {
    ML: { name: 'Machine Learning (ML)', data: mlData, key: 'ml' },
    DAA: { name: 'Algorithms (DAA)', data: daaData, key: 'daa' },
    OOPM: { name: 'OOP Programming (OOPM)', data: oopmData, key: 'oopm' }
  };

  // Detect active subject from current experiment or default to ML
  const currentSubjectKey = (experiments[0]?.subject || 'ML').toUpperCase();
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(currentSubjectKey);

  const activeSubjectObj = subjectsMap[selectedSubjectKey] || subjectsMap.ML;
  const availableExpList = activeSubjectObj.data;

  const sections = [
    { id: 'aim', label: 'Aim', icon: Target },
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'procedure', label: 'Title & Procedure', icon: FileText },
    { id: 'simulation', label: 'Simulation', icon: Cpu },
    { id: 'assignment', label: 'Assignment', icon: HelpCircle },
    { id: 'result', label: 'Result', icon: BarChart3 },
    { id: 'conclusion', label: 'Conclusion', icon: CheckCircle2 }
  ];

  const handleSubjectDropdownChange = (subKey) => {
    setSelectedSubjectKey(subKey);
    const firstExp = subjectsMap[subKey].data[0];
    if (firstExp) {
      navigate(`/experiments/${subjectsMap[subKey].key}/${firstExp.id}`);
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide Bar Container */}
      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 bg-white border-r border-slate-200 shadow-md transform transition-transform duration-300 ease-in-out flex flex-col justify-between overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Mobile Close Button Header */}
          <div className="flex items-center justify-between lg:hidden border-b border-slate-100 pb-3">
            <span className="font-bold text-[#800000] text-base flex items-center gap-2">
              <ListOrdered className="h-5 w-5" /> Experiment Menu
            </span>
            <button 
              onClick={onClose}
              className="p-1 rounded-md text-slate-500 hover:text-[#800000] hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Experiment Sections List */}
          <div>
            <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Experiment Sections
            </h3>
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#800000] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-red-50 hover:text-[#800000]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#800000]'}`} />
                      <span>{section.label}</span>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-white" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Subject & Available Experiments Selector */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#800000]" /> Lab Subject
              </h3>
            </div>

            {/* Subject Selector Dropdown */}
            <select
              value={selectedSubjectKey}
              onChange={(e) => handleSubjectDropdownChange(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-[#800000] outline-none cursor-pointer"
            >
              <option value="ML">Machine Learning (ML)</option>
              <option value="DAA">Design & Analysis of Algorithms (DAA)</option>
              <option value="OOPM">Object Oriented Programming (OOPM)</option>
            </select>

            <h3 className="px-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-2">
              Available Experiments ({availableExpList.length})
            </h3>

            {/* List of Available Experiments */}
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {availableExpList.map((exp, idx) => {
                const isSelected = exp.id === currentExperimentId;
                return (
                  <button
                    key={exp.id}
                    onClick={() => {
                      navigate(`/experiments/${activeSubjectObj.key}/${exp.id}`);
                      if (onClose) onClose();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-red-100 text-[#800000] font-bold border-l-4 border-[#800000]'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="line-clamp-2">
                      Expt {idx + 1}: {exp.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
          KJSIT Virtual Lab Module
        </div>
      </aside>
    </>
  );
}
