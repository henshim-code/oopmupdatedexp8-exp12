import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import daaData from '../data/daa/daa.json';
import mlData from '../data/ml/ml.json';
import oopmData from '../data/oopm/oopm.json';
import { BookOpen, ArrowRight, Code, Layers, Sparkles } from 'lucide-react';

export default function Experiments() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subject') || 'ALL';
  const [selectedSubject, setSelectedSubject] = useState(initialSubject.toUpperCase());

  const allExperiments = [
    ...daaData.map(e => ({ ...e, subjectKey: 'daa' })),
    ...mlData.map(e => ({ ...e, subjectKey: 'ml' })),
    ...oopmData.map(e => ({ ...e, subjectKey: 'oopm' }))
  ];

  const filteredExperiments = selectedSubject === 'ALL'
    ? allExperiments
    : allExperiments.filter(e => e.subject.toUpperCase() === selectedSubject);

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#800000] tracking-tight mb-3">
            KJSIT Virtual Lab Experiments
          </h1>
          <p className="text-slate-600 text-base">
            Select an experiment to view its Aim, Theory, Procedure, Simulation, Results, and Conclusion.
          </p>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {['ALL', 'DAA', 'ML', 'OOPM'].map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-xs ${
                selectedSubject === sub
                  ? 'bg-[#800000] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-red-50 hover:text-[#800000] border border-slate-200'
              }`}
            >
              {sub === 'ALL' ? 'All Subjects' : sub}
            </button>
          ))}
        </div>

        {/* Experiments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiments.map((exp) => (
            <div
              key={`${exp.subjectKey}-${exp.id}`}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between border-t-4 border-t-[#800000] group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-red-50 text-[#800000] text-xs font-bold rounded-full">
                    {exp.subject}
                  </span>
                  <BookOpen className="h-5 w-5 text-[#800000]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#800000] transition-colors mb-2">
                  {exp.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 mb-6">
                  {exp.aim}
                </p>
              </div>

              <Link
                to={`/experiments/${exp.subjectKey}/${exp.id}`}
                className="inline-flex items-center justify-between w-full bg-slate-50 hover:bg-[#800000] text-slate-700 hover:text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
              >
                <span>Launch Experiment</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
