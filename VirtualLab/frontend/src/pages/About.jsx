import React from 'react';
import { Link } from 'react-router-dom';
import { Beaker, Award, Users, BookOpen } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-[#FAF8F8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 bg-red-100 text-[#800000] px-4 py-1.5 rounded-full text-xs font-bold">
            <Beaker className="h-4 w-4" />
            <span>KJSIT Virtual Laboratory</span>
          </div>
          <h1 className="text-4xl font-extrabold text-[#800000]">
            About KJ Somaiya Institute of Technology Virtual Lab
          </h1>
          <p className="text-slate-600 text-lg max-w-3xl mx-auto">
            Providing interactive, high-quality, digital learning environments for engineering students.
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-[#800000] pl-3">
            Our Mission & Objective
          </h2>
          <p className="text-slate-700 leading-relaxed">
            The KJSIT Virtual Lab initiative provides students with remote access to interactive experiment simulations, step-by-step procedures, algorithmic code sandboxes, and instant assessments.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
              <Award className="h-8 w-8 text-[#800000] mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">Quality Education</h3>
              <p className="text-slate-600 text-xs">Standardized experiment curricula with rich content.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
              <Users className="h-8 w-8 text-[#800000] mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">Accessible Anywhere</h3>
              <p className="text-slate-600 text-xs">Learn & test anytime from browser or mobile device.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
              <BookOpen className="h-8 w-8 text-[#800000] mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">Interactive Sandbox</h3>
              <p className="text-slate-600 text-xs">Evaluate algorithms with live execution simulations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
