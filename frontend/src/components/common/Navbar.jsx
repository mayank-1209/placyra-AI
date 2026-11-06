import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDispatch } from 'react-redux';
import { openAuthModal } from '../../store/slices/authSlice';
import { ThemeToggle } from '../../features/theme/ThemeToggle';
import { LogOut, Shield, Sparkles, GraduationCap, BookOpen, LayoutDashboard, Home, PenTool } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'tnp_admin':
      case 'admin':
      case 'super_admin':
        return {
          label: 'T&P Cell Admin',
          color: 'bg-success-subtle text-success border-success/20',
          icon: <Shield className="w-3.5 h-3.5 mr-1" />,
        };
      case 'alumni':
        return {
          label: 'Alumni Mentor',
          color: 'bg-warning-subtle text-warning border-warning/20',
          icon: <Sparkles className="w-3.5 h-3.5 mr-1" />,
        };
      default:
        return {
          label: 'Student Candidate',
          color: 'bg-accent-subtle text-accent border-accent/20',
          icon: <GraduationCap className="w-3.5 h-3.5 mr-1" />,
        };
    }
  };

  const badge = getRoleBadge(user?.role);
  const dashboardLink = user?.role === 'tnp_admin' || user?.role === 'alumni' || user?.role === 'admin' ? '/tnp' : '/student';

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo in Upper Corner */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/assets/placyra-logo.svg"
              alt="Placyra Logo"
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center ${
                isActive('/') && location.pathname === '/'
                  ? 'bg-surface-2 text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover'
              }`}
            >
              <Home className="w-4 h-4 mr-1.5" />
              Home
            </Link>

            <Link
              to="/student"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center ${
                isActive('/student')
                  ? 'bg-surface-2 text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              Placement Hub
            </Link>

            {user && (user.role === 'tnp_admin' || user.role === 'alumni' || user.role === 'admin') && (
              <Link
                to="/tnp"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center ${
                  isActive('/tnp')
                    ? 'bg-surface-2 text-accent'
                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                }`}
              >
                <Shield className="w-4 h-4 mr-1.5" />
                T&P Portal
              </Link>
            )}

            <Link
              to="/blog"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center ${
                isActive('/blog') && !location.pathname.startsWith('/blog/editor')
                  ? 'bg-surface-2 text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover'
              }`}
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Blog & Guides
            </Link>

            {user && (user.role === 'author' || user.role === 'editor' || user.role === 'admin' || user.role === 'super_admin' || user.role === 'tnp_admin') && (
              <Link
                to="/blog/editor"
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center ${
                  isActive('/blog/editor')
                    ? 'bg-surface-2 text-accent'
                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                }`}
              >
                <PenTool className="w-4 h-4 mr-1.5" />
                Write
              </Link>
            )}
          </nav>
        </div>

        {/* Right Actions: Theme Toggle & Auth State */}
        <div className="flex items-center space-x-3">
          <ThemeToggle compact={true} />

          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3 border-l border-border pl-3">
              {/* Role Badge */}
              <div
                className={`hidden lg:flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
              >
                {badge.icon}
                {badge.label}
              </div>

              {/* User Avatar & Name */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-contrast flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-text leading-tight truncate max-w-[120px]">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] text-text-muted leading-tight truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-subtle rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 border-l border-border pl-3">
              <button
                onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                className="px-3.5 py-1.5 text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-hover rounded-xl transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => dispatch(openAuthModal({ mode: 'signup' }))}
                className="px-4 py-1.5 text-xs font-semibold bg-accent hover:bg-accent-hover text-accent-contrast rounded-xl shadow-sm transition-all"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
