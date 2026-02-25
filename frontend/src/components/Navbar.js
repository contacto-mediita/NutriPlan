import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Utensils, Menu, X, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = user ? [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/progreso', label: 'Progreso' },
    { path: '/cuestionario', label: 'Cuestionario' },
    { path: '/precios', label: 'Precios' },
  ] : [
    { path: '/', label: 'Inicio' },
    { path: '/precios', label: 'Precios' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="navbar-logo">
            <Utensils className="w-8 h-8 text-brand-green" />
            <span className="text-xl font-heading font-bold text-brand-green">NutriPlan</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors ${
                  isActive(link.path) 
                    ? 'text-brand-green' 
                    : 'text-muted-foreground hover:text-brand-green'
                }`}
                data-testid={`nav-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full gap-2" data-testid="user-menu-trigger">
                    <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-brand-green" />
                    </div>
                    <span className="font-medium">{user.name?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/historial')} data-testid="menu-history">
                    <User className="w-4 h-4 mr-2" />
                    Historial
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="menu-logout">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="rounded-full" data-testid="nav-login-btn">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-brand-orange hover:bg-brand-orange/90 rounded-full" data-testid="nav-register-btn">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive(link.path) 
                      ? 'bg-brand-green/10 text-brand-green' 
                      : 'text-muted-foreground hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {user ? (
                <>
                  <Link
                    to="/historial"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-gray-50"
                  >
                    Historial
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 text-left"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <div className="flex gap-2 mt-2 px-4">
                  <Link to="/auth" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link to="/auth" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-brand-orange hover:bg-brand-orange/90 rounded-full">
                      Registrarse
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
