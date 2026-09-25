import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Beaker, BookOpen, Home, Info } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeStyle = ({ isActive }) =>
    `px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
      isActive
        ? 'text-white border-white font-semibold'
        : 'text-red-100 hover:text-white border-transparent hover:border-red-200'
    }`;

  return (
    <header className="bg-[#800000] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-white text-[#800000] p-1.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
              <Beaker className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              KJSIT Virtual Lab
            </span>
          </Link>

          {/* Desktop Navigation Links - Using NavLink / Link */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavLink to="/" className={activeStyle}>
              Home
            </NavLink>
            <NavLink to="/experiments" className={activeStyle}>
              Experiments
            </NavLink>
            <NavLink to="/about" className={activeStyle}>
              About Us
            </NavLink>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-red-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#6B0000] border-t border-red-900/40 px-4 pt-2 pb-4 space-y-2">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${
                isActive ? 'bg-red-900 text-white font-bold' : 'text-red-100 hover:bg-red-800'
              }`
            }
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/experiments"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${
                isActive ? 'bg-red-900 text-white font-bold' : 'text-red-100 hover:bg-red-800'
              }`
            }
          >
            <BookOpen className="h-5 w-5" />
            <span>Experiments</span>
          </NavLink>

          <NavLink
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium ${
                isActive ? 'bg-red-900 text-white font-bold' : 'text-red-100 hover:bg-red-800'
              }`
            }
          >
            <Info className="h-5 w-5" />
            <span>About Us</span>
          </NavLink>
        </div>
      )}
    </header>
  );
}
