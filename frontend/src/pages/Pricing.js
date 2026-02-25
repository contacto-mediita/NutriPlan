import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, Gift, Calendar, Star, X, Utensils, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const plans = [
  {
    id: '3days',
    name: '3 Días',
    price: 49,
    period: '3 días',
    description: 'Prueba el servicio',
    icon: Zap,
    color: 'blue',
    features: [
      'Plan alimenticio de 3 días',
      'Personalizado con IA',
      '4 comidas diarias',
      'Lista de compras'
    ],
    popular: false
  },
  {
    id: 'weekly',
    name: 'Semana',
    price: 119,
    period: '7 días',
    description: 'Plan semanal completo',
    icon: Calendar,
    color: 'green',
    features: [
      'Plan alimenticio de 7 días',
      'Personalizado con IA',
      '4 comidas diarias',
      'Recomendaciones personalizadas',
      'Lista de compras'
    ],
    popular: false
  },
  {
    id: 'biweekly',
    name: 'Quincena',
    price: 199,
    period: '15 días',
    description: 'Mejor valor',
    icon: Star,
    color: 'orange',
    features: [
      'Plan alimenticio de 15 días',
      'Personalizado con IA',
      '4 comidas diarias',
      'Recomendaciones personalizadas',
      'Lista de compras',
      'Ajustes a mitad del plan'
    ],
    popular: true
  },
  {
    id: 'monthly',
    name: 'Mes',
    price: 349,
    period: '30 días',
    description: 'Transformación completa',
    icon: Crown,
    color: 'purple',
    features: [
      'Plan alimenticio de 30 días',
      'Personalizado con IA',
      '4 comidas diarias',
      'Recomendaciones personalizadas',
      'Lista de compras',
      'Ajustes semanales',
      'Soporte prioritario'
    ],
    popular: false
  }
];

const Pricing = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialPlan, setTrialPlan] = useState(null);
  const [generatingTrial, setGeneratingTrial] = useState(false);
  const [hasQuestionnaire, setHasQuestionnaire] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  useEffect(() => {
    if (user) {
      checkQuestionnaireAndTrial();
    }
  }, [user]);

  const checkQuestionnaireAndTrial = async () => {
    try {
      const [questionnaireRes, plansRes] = await Promise.all([
        axios.get(`${API}/questionnaire`),
        axios.get(`${API}/meal-plans`)
      ]);
      setHasQuestionnaire(!!questionnaireRes.data);
      const trialExists = plansRes.data.some(p => p.plan_type === 'trial');
      setHasUsedTrial(trialExists);
      if (trialExists) {
        setTrialPlan(plansRes.data.find(p => p.plan_type === 'trial'));
      }
    } catch (error) {
      console.error('Error checking questionnaire:', error);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!hasQuestionnaire) {
      toast.error('Primero completa el cuestionario');
      navigate('/cuestionario');
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

  const handleGenerateTrial = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!hasQuestionnaire) {
      toast.error('Primero completa el cuestionario');
      navigate('/cuestionario');
      return;
    }

    setGeneratingTrial(true);
    try {
      const response = await axios.post(`${API}/meal-plans/trial`);
      setTrialPlan(response.data);
      setHasUsedTrial(true);
      toast.success('¡Plan de prueba generado!');
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al generar el plan';
      toast.error(message);
    } finally {
      setGeneratingTrial(false);
    }
  };

  const hasActiveSubscription = () => {
    if (!user?.subscription_type || !user?.subscription_expires) return false;
    return new Date(user.subscription_expires) > new Date();
  };

  const getColorClasses = (color, isPopular) => {
    const colors = {
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500' },
      green: { bg: 'bg-brand-green/10', text: 'text-brand-green', border: 'border-brand-green' },
      orange: { bg: 'bg-brand-orange/10', text: 'text-brand-orange', border: 'border-brand-orange' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500' }
    };
    return colors[color] || colors.green;
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-12" data-testid="pricing-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Precios Accesibles
          </span>
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Elige tu <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Planes alimenticios personalizados con IA. Comienza con tu plan de prueba gratuito.
          </p>
        </motion.div>

        {/* Free Trial Banner */}
        {user && hasQuestionnaire && !hasUsedTrial && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-brand-green to-brand-lime rounded-3xl p-6 mb-10 text-white"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Gift className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">¡Plan de Prueba Gratis!</h3>
                  <p className="text-white/80">Obtén un plan de 1 día con 4 comidas sin costo</p>
                </div>
              </div>
              <Button
                onClick={() => setShowTrialModal(true)}
                className="bg-white text-brand-green hover:bg-white/90 rounded-full px-8 font-bold"
                data-testid="open-trial-btn"
              >
                Probar Gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Show trial result button if already used */}
        {hasUsedTrial && trialPlan && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-4 mb-8 text-center"
          >
            <p className="text-brand-green font-medium mb-2">
              ✓ Ya utilizaste tu plan de prueba gratuito
            </p>
            <Button
              onClick={() => setShowTrialModal(true)}
              variant="outline"
              className="rounded-full border-brand-green text-brand-green hover:bg-brand-green/5"
              data-testid="view-trial-btn"
            >
              Ver mi plan de prueba
            </Button>
          </motion.div>
        )}

        {hasActiveSubscription() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-6 mb-8 text-center"
          >
            <p className="text-brand-green font-semibold">
              ✓ Tienes una suscripción activa
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

        {/* Pricing Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const colorClasses = getColorClasses(plan.color, plan.popular);
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-3xl p-6 shadow-lg transition-all hover:shadow-xl ${
                  plan.popular ? `border-2 ${colorClasses.border} ring-4 ring-brand-orange/10` : 'border border-gray-100'
                }`}
                data-testid={`plan-card-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-full">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses.bg}`}>
                    <plan.icon className={`w-5 h-5 ${colorClasses.text}`} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-4xl font-heading font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">/ {plan.period}</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClasses.text}`} />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                  className={`w-full rounded-full py-5 font-bold transition-all ${
                    plan.popular 
                      ? 'bg-brand-orange hover:bg-brand-orange/90 text-white shadow-lg' 
                      : 'bg-gray-100 hover:bg-gray-200 text-foreground'
                  }`}
                  data-testid={`subscribe-btn-${plan.id}`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></span>
                    </span>
                  ) : (
                    hasActiveSubscription() && user.subscription_type === plan.id 
                      ? 'Plan Activo' 
                      : 'Elegir Plan'
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-muted-foreground text-sm">
            Pagos seguros con Stripe • Precios en MXN • Cancela cuando quieras
          </p>
        </motion.div>
      </div>

      {/* Trial Modal */}
      <Dialog open={showTrialModal} onOpenChange={setShowTrialModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Gift className="w-6 h-6 text-brand-green" />
              Plan de Prueba Gratuito
            </DialogTitle>
          </DialogHeader>
          
          {!trialPlan ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-10 h-10 text-brand-green" />
              </div>
              <h3 className="text-xl font-bold mb-2">¿Listo para probar?</h3>
              <p className="text-muted-foreground mb-6">
                Generaremos un plan de 1 día con 4 comidas personalizado para ti.
                <br />
                <span className="font-medium">Desayuno • Snack • Comida • Cena</span>
              </p>
              <Button
                onClick={handleGenerateTrial}
                disabled={generatingTrial}
                className="bg-brand-green hover:bg-brand-green/90 rounded-full px-8 py-6 text-lg font-bold"
                data-testid="generate-trial-btn"
              >
                {generatingTrial ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                    Generando tu plan...
                  </span>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Generar Plan Gratis
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="py-4">
              <div className="bg-brand-green/5 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Calorías objetivo</p>
                    <p className="text-2xl font-bold text-brand-green">{trialPlan.calories_target} kcal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Macros</p>
                    <p className="text-sm">
                      P: {trialPlan.macros?.proteinas}g • C: {trialPlan.macros?.carbohidratos}g • G: {trialPlan.macros?.grasas}g
                    </p>
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-lg mb-4">Tu menú del día:</h4>
              <div className="space-y-3">
                {trialPlan.plan_data?.dias?.[0]?.comidas?.map((meal, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        index % 2 === 0 ? 'bg-brand-green/10' : 'bg-brand-orange/10'
                      }`}>
                        <Utensils className={`w-5 h-5 ${index % 2 === 0 ? 'text-brand-green' : 'text-brand-orange'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-muted-foreground uppercase">{meal.tipo}</span>
                          {meal.calorias && <span className="text-sm font-medium text-brand-orange">{meal.calorias} kcal</span>}
                        </div>
                        <h5 className="font-semibold text-foreground">{meal.nombre}</h5>
                        <p className="text-sm text-muted-foreground">
                          {Array.isArray(meal.ingredientes) 
                            ? meal.ingredientes.map(ing => 
                                typeof ing === 'object' ? `${ing.item} (${ing.cantidad})` : ing
                              ).join(', ')
                            : ''
                          }
                        </p>
                        {meal.tip && (
                          <p className="text-xs text-brand-green mt-2 italic bg-brand-green/5 p-2 rounded">💡 {meal.tip}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {trialPlan.recommendations?.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-bold mb-3">Recomendaciones:</h4>
                  <ul className="space-y-2">
                    {trialPlan.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-brand-green mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 p-4 bg-brand-orange/10 rounded-xl text-center">
                <p className="font-medium text-brand-orange mb-2">¿Te gustó tu plan de prueba?</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Suscríbete para obtener planes completos de hasta 30 días
                </p>
                <Button
                  onClick={() => setShowTrialModal(false)}
                  className="bg-brand-orange hover:bg-brand-orange/90 rounded-full"
                >
                  Ver todos los planes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
