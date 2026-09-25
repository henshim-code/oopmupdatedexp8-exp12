import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Beaker, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#6B0000] text-red-100 border-t border-red-900/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Institute Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center space-x-3 text-white font-bold text-xl">
              <div className="bg-white text-[#800000] p-1.5 rounded-md">
                <Beaker className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span>KJSIT Virtual Lab</span>
            </Link>
            <p className="text-sm text-red-200 leading-relaxed">
              KJ Somaiya Institute of Technology digital experiment platform designed for mastering algorithm design, machine learning, and core computer science concepts.
            </p>
          </div>

          {/* Col 2: Navigation Links using Link/NavLink */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4 border-b border-red-800 pb-2">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? 'text-white font-bold underline' : 'hover:text-white transition-colors'
                  }
                >
                  Home Page
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/experiments"
                  className={({ isActive }) =>
                    isActive ? 'text-white font-bold underline' : 'hover:text-white transition-colors'
                  }
                >
                  Browse Experiments
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    isActive ? 'text-white font-bold underline' : 'hover:text-white transition-colors'
                  }
                >
                  About KJSIT Virtual Lab
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Col 3: Experiments Subjects */}
          <div>
            <h3 className="text-white font-semibold text-base mb-4 border-b border-red-800 pb-2">
              Lab Subjects
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/experiments?subject=DAA" className="hover:text-white transition-colors">
                  Design & Analysis of Algorithms (DAA)
                </Link>
              </li>
              <li>
                <Link to="/experiments?subject=ML" className="hover:text-white transition-colors">
                  Machine Learning (ML)
                </Link>
              </li>
              <li>
                <Link to="/experiments?subject=OOPM" className="hover:text-white transition-colors">
                  Object Oriented Programming (OOPM)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Institute Info */}
          <div className="space-y-3 text-sm">
            <h3 className="text-white font-semibold text-base mb-4 border-b border-red-800 pb-2">
              Institute Info
            </h3>
            <p className="text-red-200">
              <strong className="text-white">KJ Somaiya Institute of Technology</strong>
              <br />
              Sion, Mumbai, Maharashtra 400022
            </p>
            <div className="pt-2 text-xs text-red-300">
              Department of Computer Engineering & IT
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 pt-6 border-t border-red-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-red-300">
          <p>© {new Date().getFullYear()} KJSIT Virtual Lab. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Crafted for KJSIT Students with</span>
            <Heart className="h-3.5 w-3.5 text-red-400 fill-current" />
          </p>
        </div>
      </div>
    </footer>
  );
}
