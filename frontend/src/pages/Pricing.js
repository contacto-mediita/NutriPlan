import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const plans = [
  {
    id: 'weekly',
    name: 'Plan Semanal',
    price: 199,
    period: 'por semana',
    description: 'Perfecto para probar el servicio',
    icon: Zap,
    features: [
      '1 plan alimenticio semanal',
      'Personalizado con IA',
      '5 comidas diarias',
      'Recomendaciones personalizadas',
      'Acceso por 7 días'
    ],
    popular: false
  },
  {
    id: 'monthly',
    name: 'Plan Mensual',
    price: 499,
    period: 'por mes',
    description: 'El mejor valor para tu transformación',
    icon: Crown,
    features: [
      'Planes ilimitados por 30 días',
      'Personalizado con IA',
      '5 comidas diarias',
      'Recomendaciones personalizadas',
      'Ajustes según tu progreso',
      'Soporte prioritario'
    ],
    popular: true
  }
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(planId);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/payments/checkout`, {
        plan_type: planId,
        origin_url: originUrl
      });
      
      window.location.href = response.data.url;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al procesar el pago';
      toast.error(message);
      setLoading(null);
    }
  };

  const hasActiveSubscription = () => {
    if (!user?.subscription_type || !user?.subscription_expires) return false;
    return new Date(user.subscription_expires) > new Date();
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-6 py-16" data-testid="pricing-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Precios Simples
          </span>
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Elige tu <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Invierte en tu salud. Obtén planes alimenticios personalizados creados por IA especialmente para ti.
          </p>
        </motion.div>

        {hasActiveSubscription() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-6 mb-8 text-center"
          >
            <p className="text-brand-green font-semibold">
              ✓ Tienes una suscripción {user.subscription_type === 'monthly' ? 'mensual' : 'semanal'} activa
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Vence el {new Date(user.subscription_expires).toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-3xl p-8 shadow-lg transition-all hover:shadow-xl ${
                plan.popular ? 'border-2 border-brand-orange ring-4 ring-brand-orange/10' : 'border border-gray-100'
              }`}
              data-testid={`plan-card-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-orange text-white text-sm font-bold px-4 py-1 rounded-full">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  plan.popular ? 'bg-brand-orange/10' : 'bg-brand-green/10'
                }`}>
                  <plan.icon className={`w-6 h-6 ${plan.popular ? 'text-brand-orange' : 'text-brand-green'}`} />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-heading font-bold text-foreground">${plan.price}</span>
                <span className="text-muted-foreground ml-2">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? 'bg-brand-orange/10' : 'bg-brand-green/10'
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? 'text-brand-orange' : 'text-brand-green'}`} />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className={`w-full rounded-full py-6 font-bold text-lg transition-all ${
                  plan.popular 
                    ? 'bg-brand-orange hover:bg-brand-orange/90 text-white shadow-lg hover:shadow-xl' 
                    : 'bg-white border-2 border-brand-green text-brand-green hover:bg-brand-green/5'
                }`}
                data-testid={`subscribe-btn-${plan.id}`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></span>
                    Procesando...
                  </span>
                ) : (
                  hasActiveSubscription() && user.subscription_type === plan.id 
                    ? 'Plan Activo' 
                    : 'Comenzar Ahora'
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground text-sm">
            Pagos seguros con Stripe. Puedes cancelar en cualquier momento.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
