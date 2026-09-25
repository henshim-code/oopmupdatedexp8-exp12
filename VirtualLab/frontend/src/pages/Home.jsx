import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, BarChart2, Laptop, ArrowRight, BookOpen, CheckCircle, Code, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF8F8] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#800000] tracking-tight mb-6">
          Welcome to KJSIT Virtual Lab
        </h1>
        <p className="text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          An interactive digital platform designed for students of KJ Somaiya Institute of Technology to experiment, visualize, and master Design and Analysis of Algorithms (DAA) concepts anywhere, anytime.
        </p>

        <div>
          <Link
            to="/experiments"
            className="inline-flex items-center space-x-2 bg-[#800000] hover:bg-[#6B0000] text-white px-8 py-3.5 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            <span>Explore Experiments</span>
            <ArrowRight className="h-5 w-5 ml-1" />
          </Link>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Section Heading with Red Left Indicator */}
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-1.5 h-8 bg-[#800000] rounded-full"></div>
          <h2 className="text-3xl font-bold text-[#800000]">Key Features</h2>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-amber-500 fill-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Interactive Simulations
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Step through algorithm steps dynamically with real-time variable tracking and interactive inputs.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <BarChart2 className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Real-Time Analysis
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Observe asymptotic notation, time/space complexity graphs, and execution performance metrics.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <Laptop className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Concept Mastery
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Complete aims, detailed theory, code implementations, self-assessment quizzes, and conclusions.
            </p>
          </div>
        </div>
      </section>

      {/* Available Subjects Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full mb-12">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-1.5 h-8 bg-[#800000] rounded-full"></div>
          <h2 className="text-3xl font-bold text-[#800000]">Explore Lab Subjects</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* DAA Subject Card */}
          <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group border-t-4 border-t-[#800000]">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-red-50 text-[#800000] text-xs font-bold rounded-full">
                Core DAA
              </span>
              <Code className="h-6 w-6 text-[#800000]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#800000] transition-colors mb-2">
              Design & Analysis of Algorithms
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              Divide & Conquer, Dynamic Programming, Greedy Strategy, Graph Algorithms, and complexity bounds.
            </p>
            <Link
              to="/experiments?subject=DAA"
              className="inline-flex items-center text-sm font-semibold text-[#800000] hover:underline"
            >
              Start DAA Labs <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* ML Subject Card */}
          <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group border-t-4 border-t-[#800000]">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-red-50 text-[#800000] text-xs font-bold rounded-full">
                Machine Learning
              </span>
              <Layers className="h-6 w-6 text-[#800000]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#800000] transition-colors mb-2">
              Machine Learning Lab
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              Supervised Learning models, Linear Regression, Gradient Descent, and model optimization.
            </p>
            <Link
              to="/experiments?subject=ML"
              className="inline-flex items-center text-sm font-semibold text-[#800000] hover:underline"
            >
              Start ML Labs <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* OOPM Subject Card */}
          <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group border-t-4 border-t-[#800000]">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-red-50 text-[#800000] text-xs font-bold rounded-full">
                OOP Programming
              </span>
              <BookOpen className="h-6 w-6 text-[#800000]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#800000] transition-colors mb-2">
              Object Oriented Programming
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              Inheritance, Polymorphism, Data Encapsulation, Method Overriding, and Abstraction.
            </p>
            <Link
              to="/experiments?subject=OOPM"
              className="inline-flex items-center text-sm font-semibold text-[#800000] hover:underline"
            >
              Start OOPM Labs <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
