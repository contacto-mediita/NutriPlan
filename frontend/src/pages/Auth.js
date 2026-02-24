import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('¡Bienvenido de vuelta!');
      } else {
        if (!formData.name.trim()) {
          toast.error('Por favor ingresa tu nombre');
          setLoading(false);
          return;
        }
        await register(formData.name, formData.email, formData.password);
        toast.success('¡Cuenta creada exitosamente!');
      }
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al procesar la solicitud';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream to-white flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-green/90"></div>
        <img 
          src="https://images.pexels.com/photos/3978830/pexels-photo-3978830.jpeg"
          alt="Ingredientes frescos"
          className="w-full h-full object-cover mix-blend-overlay"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Utensils className="w-16 h-16 mx-auto mb-6 text-brand-lime" />
            <h1 className="text-4xl font-heading font-bold mb-4">NutriPlan</h1>
            <p className="text-xl text-white/80 max-w-md">
              Tu plan alimenticio personalizado está a un paso de distancia
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Utensils className="w-10 h-10 text-brand-green" />
            <span className="text-2xl font-heading font-bold text-brand-green">NutriPlan</span>
          </Link>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
              {isLogin ? '¡Bienvenido!' : 'Crea tu cuenta'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? 'Ingresa a tu cuenta para continuar' : 'Comienza tu transformación hoy'}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-muted rounded-full p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-full font-semibold transition-all ${
                isLogin ? 'bg-white text-foreground shadow-md' : 'text-muted-foreground'
              }`}
              data-testid="toggle-login-btn"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-full font-semibold transition-all ${
                !isLogin ? 'bg-white text-foreground shadow-md' : 'text-muted-foreground'
              }`}
              data-testid="toggle-register-btn"
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-foreground font-medium">Nombre completo</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-12 h-14 rounded-xl border-2 focus:border-brand-green"
                      placeholder="Tu nombre"
                      data-testid="input-name"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-12 h-14 rounded-xl border-2 focus:border-brand-green"
                  placeholder="tu@email.com"
                  required
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-12 pr-12 h-14 rounded-xl border-2 focus:border-brand-green"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              data-testid="submit-auth-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Al continuar, aceptas nuestros{' '}
            <a href="#" className="text-brand-green hover:underline">Términos de Servicio</a>
            {' '}y{' '}
            <a href="#" className="text-brand-green hover:underline">Política de Privacidad</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
