import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Sparkles, GraduationCap } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'tnp_admin':
        return {
          label: 'T&P Cell Admin',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <Shield className="w-3.5 h-3.5 mr-1" />,
        };
      case 'alumni':
        return {
          label: 'Alumni Mentor',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <Sparkles className="w-3.5 h-3.5 mr-1" />,
        };
      default:
        return {
          label: 'Student Candidate',
          color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          icon: <GraduationCap className="w-3.5 h-3.5 mr-1" />,
        };
    }
  };

  const badge = getRoleBadge(user?.role);
  const homeLink = user?.role === 'student' ? '/student' : '/tnp';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo in Upper Corner */}
        <Link to={homeLink} className="flex items-center space-x-3 group">
          <img
            src="/assets/placyra-logo.svg"
            alt="Placyra Logo"
            className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        {/* User Profile & Actions */}
        {user && (
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            <div
              className={`hidden sm:flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
            >
              {badge.icon}
              {badge.label}
            </div>

            {/* User Details */}
            <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow-inner">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-100 leading-none">
                  {user.full_name}
                </p>
                <p className="text-xs text-slate-400 mt-1 truncate max-w-[140px]">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
