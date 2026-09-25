import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import LabLayout from '../components/layout/LabLayout';
import daaData from '../data/daa/daa.json';
import mlData from '../data/ml/ml.json';
import oopmData from '../data/oopm/oopm.json';
import DaaModule from '../labs/daa/module/DaaModule';
import MlModule from '../labs/ml/module/MlModule';
import OopmModule from '../labs/oopm/module/OopmModule';

import { 
  Target, 
  BookOpen, 
  FileText, 
  Cpu, 
  HelpCircle,
  BarChart3, 
  CheckCircle2, 
  Menu, 
  ArrowLeft, 
  Check, 
  X, 
  Code,
  Sparkles
} from 'lucide-react';

export default function ExperimentDetail() {
  const { subject = 'DAA', experimentId } = useParams();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('aim');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Map of data sources
  const dataMap = {
    DAA: daaData,
    ML: mlData,
    OOPM: oopmData,
  };

  const subjectUpper = subject.toUpperCase();
  const subjectData = dataMap[subjectUpper] || daaData;
  
  // Find current experiment or default to first
  const experiment = subjectData.find(e => e.id === experimentId) || subjectData[0];

  useEffect(() => {
    // Reset state on experiment change
    setActiveSection('aim');
    setUserAnswers({});
    setQuizSubmitted(false);
  }, [experimentId, subject]);

  if (!experiment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F8]">
        <div className="text-center p-8 bg-white rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-[#800000] mb-4">Experiment Not Found</h2>
          <p className="text-slate-600 mb-6">The requested experiment could not be loaded from JSON.</p>
          <Link to="/experiments" className="bg-[#800000] text-white px-5 py-2 rounded-lg font-medium">
            Back to Experiments
          </Link>
        </div>
      </div>
    );
  }

  const handleSelectExperiment = (id) => {
    navigate(`/experiments/${subject.toLowerCase()}/${id}`);
  };

  const handleQuizOptionSelect = (questionId, option) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  // Helper to render lab module simulation container dynamically based on subject folder
  const renderLabSimulationModule = () => {
    if (subjectUpper === 'ML') {
      return <MlModule experiment={experiment} />;
    } else if (subjectUpper === 'OOPM') {
      return <OopmModule experiment={experiment} />;
    }
    return <DaaModule experiment={experiment} />;
  };

  return (
    <div className="min-h-screen bg-[#FAF8F8] flex flex-col">
      {/* Experiment Header Banner */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {/* Mobile Slide Bar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-red-50 text-[#800000] hover:bg-red-100 transition-colors"
              title="Toggle Slide Bar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Link to="/experiments" className="hover:text-[#800000] flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Experiments
                </Link>
                <span>/</span>
                <span className="font-semibold text-[#800000]">{experiment.subjectFull || experiment.subject}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {experiment.title}
              </h1>
            </div>
          </div>

         {/* <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-red-100 text-[#800000] text-xs font-bold rounded-full">
              JSON Content
            </span>
          </div> */}
        </div>
      </div>

      {/* Main Content Layout using LabLayout component */}
      <LabLayout
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        experiments={subjectData}
        currentExperimentId={experiment.id}
        onSelectExperiment={handleSelectExperiment}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      >
        {/* 1. AIM SECTION */}
        {activeSection === 'aim' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-red-50 text-[#800000] rounded-xl">
                <Target className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Aim of Experiment</h2>
                <p className="text-xs text-slate-500">Learning objectives and key goals</p>
              </div>
            </div>

            <div className="bg-red-50/60 border-l-4 border-[#800000] p-5 rounded-r-xl">
              <p className="text-slate-800 text-base leading-relaxed font-medium">
                {experiment.aim}
              </p>
            </div>

            {/* Objectives */}
            {experiment.objectives && experiment.objectives.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Objectives:
                </h3>
                <ul className="space-y-2">
                  {experiment.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start space-x-3 text-sm text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-[#800000] mt-1.5 flex-shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expected Outcomes */}
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Expected Outcomes:
              </h3>
              <ul className="space-y-2">
                {experiment.outcomes && experiment.outcomes.length > 0 ? (
                  experiment.outcomes.map((outc, i) => (
                    <li key={i} className="flex items-start space-x-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{outc}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start space-x-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Understand algorithmic paradigm and operational steps.</span>
                    </li>
                    <li className="flex items-start space-x-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Analyze worst-case and average-case time & space complexities.</span>
                    </li>
                    <li className="flex items-start space-x-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>Implement source code solution and evaluate performance metrics.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {experiment.tools && (
              <div className="pt-2 text-xs text-slate-500 font-medium">
                <span className="font-bold text-slate-700">Tools / Environment: </span>
                {experiment.tools}
              </div>
            )}
          </div>
        )}

        {/* 2. THEORY SECTION */}
        {activeSection === 'theory' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-red-50 text-[#800000] rounded-xl">
                <BookOpen className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Theory & Background</h2>
                <p className="text-xs text-slate-500">Theoretical foundation and mathematical concepts</p>
              </div>
            </div>

            <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-line text-sm sm:text-base leading-relaxed">
              {experiment.theory}
            </div>
          </div>
        )}

        {/* 3. TITLE & PROCEDURE SECTION */}
        {activeSection === 'procedure' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-red-50 text-[#800000] rounded-xl">
                <FileText className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Title & Procedure</h2>
                <p className="text-xs text-slate-500">Step-by-step algorithmic procedure</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
              <span className="text-xs font-bold text-[#800000] uppercase tracking-wider block mb-1">
                Experiment Title
              </span>
              <h3 className="text-lg font-bold text-slate-900">{experiment.title}</h3>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Step-by-Step Procedure</h3>
              <div className="space-y-3">
                {Array.isArray(experiment.procedure) ? (
                  experiment.procedure.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-red-200 transition-colors">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#800000] text-white flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <p className="text-slate-700 text-sm leading-relaxed pt-1">
                        {step}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-700">{experiment.procedure}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. SIMULATION SECTION */}
        {activeSection === 'simulation' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-red-50 text-[#800000] rounded-xl">
                <Cpu className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Simulation</h2>
                <p className="text-xs text-slate-500">Interactive experiment simulator workspace</p>
              </div>
            </div>

            {renderLabSimulationModule()}
          </div>
        )}

        {/* 5. ASSIGNMENT SECTION */}
        {activeSection === 'assignment' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-red-50 text-[#800000] rounded-xl">
                <HelpCircle className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Assignment</h2>
                <p className="text-xs text-slate-500">Practice tasks, coding exercise, and quiz questions</p>
              </div>
            </div>

            {/* Code Playground / Default Assignment Code */}
            {experiment.assignment?.defaultCode && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Code className="h-4 w-4 text-[#800000]" /> Assignment Code Task
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Python 3</span>
                </div>

                <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                  <pre>{experiment.assignment.defaultCode}</pre>
                </div>
              </div>
            )}

            {/* Assignment Quiz Questions */}
            {experiment.assignment?.questions && experiment.assignment.questions.length > 0 && (
              <div className="space-y-6 pt-2">
                <h3 className="text-base font-bold text-slate-900">
                  Assignment Questions
                </h3>

                {experiment.assignment.questions.map((q) => (
                  <div key={q.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                    <p className="text-sm font-bold text-slate-800">
                      Q{q.id}. {q.question}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = userAnswers[q.id] === opt;
                        const isCorrect = q.answer === opt;
                        let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:border-red-300';
                        
                        if (quizSubmitted) {
                          if (isCorrect) btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                          else if (isSelected && !isCorrect) btnStyle = 'bg-red-100 border-red-500 text-red-900 font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-red-100 border-[#800000] text-[#800000] font-bold';
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleQuizOptionSelect(q.id, opt)}
                            className={`text-left px-4 py-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isCorrect && <Check className="h-4 w-4 text-emerald-600" />}
                            {quizSubmitted && isSelected && !isCorrect && <X className="h-4 w-4 text-red-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="bg-[#800000] hover:bg-[#6B0000] text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
                  >
                    Submit Assignment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. RESULT SECTION */}
        {activeSection === 'result' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-red-50 text-[#800000] rounded-xl">
                <BarChart3 className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Experimental Result</h2>
                <p className="text-xs text-slate-500">Output verification and runtime evaluation</p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl space-y-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                Execution Summary
              </span>
              <p className="text-emerald-950 font-medium text-sm sm:text-base leading-relaxed">
                {experiment.result}
              </p>
            </div>

            {/* Sample Execution Metric Table */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900">Empirical Performance Table</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <th className="p-3 font-bold">Input Size (N)</th>
                      <th className="p-3 font-bold">Best Case</th>
                      <th className="p-3 font-bold">Average Case</th>
                      <th className="p-3 font-bold">Worst Case</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600 font-mono">
                    <tr>
                      <td className="p-3">N = 100</td>
                      <td className="p-3 text-emerald-600 font-semibold">0.002 ms</td>
                      <td className="p-3">0.005 ms</td>
                      <td className="p-3 text-red-600">0.045 ms</td>
                    </tr>
                    <tr>
                      <td className="p-3">N = 1,000</td>
                      <td className="p-3 text-emerald-600 font-semibold">0.028 ms</td>
                      <td className="p-3">0.065 ms</td>
                      <td className="p-3 text-red-600">4.120 ms</td>
                    </tr>
                    <tr>
                      <td className="p-3">N = 10,000</td>
                      <td className="p-3 text-emerald-600 font-semibold">0.380 ms</td>
                      <td className="p-3">0.820 ms</td>
                      <td className="p-3 text-red-600">415.0 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. CONCLUSION SECTION */}
        {activeSection === 'conclusion' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-red-50 text-[#800000] rounded-xl">
                <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Conclusion</h2>
                <p className="text-xs text-slate-500">Key takeaways and final remarks</p>
              </div>
            </div>

            <div className="bg-red-50/50 border border-red-200 p-6 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-[#800000] font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Lab Summary</span>
              </div>
              <p className="text-slate-800 text-base leading-relaxed font-medium">
                {experiment.conclusion}
              </p>
            </div>
          </div>
        )}
      </LabLayout>
    </div>
  );
}
