import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Utensils, Calendar, Zap, Droplets, Target, Clock, 
  ChevronRight, Plus, History, AlertCircle, Sparkles, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, questionnaireRes] = await Promise.all([
        axios.get(`${API}/meal-plans`),
        axios.get(`${API}/questionnaire`)
      ]);
      
      if (plansRes.data.length > 0) {
        setCurrentPlan(plansRes.data[0]);
      }
      setQuestionnaire(questionnaireRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!questionnaire) {
      toast.error('Primero completa el cuestionario');
      navigate('/cuestionario');
      return;
    }

    if (!user?.subscription_type) {
      toast.error('Necesitas una suscripción activa');
      navigate('/precios');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post(`${API}/meal-plans/generate`);
      setCurrentPlan(response.data);
      toast.success('¡Plan generado exitosamente!');
      await refreshUser();
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al generar el plan';
      toast.error(message);
      if (error.response?.status === 403) {
        navigate('/precios');
      }
    } finally {
      setGenerating(false);
    }
  };

  const hasActiveSubscription = () => {
    if (!user?.subscription_type || !user?.subscription_expires) return false;
    return new Date(user.subscription_expires) > new Date();
  };

  const daysUntilExpiry = () => {
    if (!user?.subscription_expires) return 0;
    const diff = new Date(user.subscription_expires) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-green border-t-transparent"></div>
      </div>
    );
  }

  const todayMeals = currentPlan?.plan_data?.dias?.[selectedDay]?.comidas || [];

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8" data-testid="dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              ¡Hola, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground">Tu panel de control nutricional</p>
          </div>
          
          <div className="flex gap-3">
            <Link to="/progreso">
              <Button variant="outline" className="rounded-full" data-testid="progress-link-btn">
                <TrendingUp className="w-4 h-4 mr-2" />
                Progreso
              </Button>
            </Link>
            <Link to="/historial">
              <Button variant="outline" className="rounded-full">
                <History className="w-4 h-4 mr-2" />
                Historial
              </Button>
            </Link>
            <Button 
              onClick={generatePlan}
              disabled={generating || !hasActiveSubscription()}
              className="bg-brand-orange hover:bg-brand-orange/90 rounded-full"
              data-testid="generate-plan-btn"
            >
              {generating ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Nuevo Plan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Subscription Status */}
        {!hasActiveSubscription() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-brand-orange/10 to-yellow-50 border border-brand-orange/20 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {user?.subscription_type ? 'Tu suscripción ha expirado' : 'Sin suscripción activa'}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Activa tu plan para generar menús personalizados con IA
                </p>
                <Link to="/precios">
                  <Button className="bg-brand-orange hover:bg-brand-orange/90 rounded-full" data-testid="activate-subscription-btn">
                    Ver Planes
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-brand-green" />
              </div>
              <span className="text-sm text-muted-foreground">Calorías/día</span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">
              {currentPlan?.calories_target || '--'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-orange" />
              </div>
              <span className="text-sm text-muted-foreground">Proteínas</span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">
              {currentPlan?.macros?.proteinas || '--'}g
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-lime/20 rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-brand-green" />
              </div>
              <span className="text-sm text-muted-foreground">Carbohidratos</span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">
              {currentPlan?.macros?.carbohidratos || '--'}g
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Droplets className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-muted-foreground">Grasas</span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">
              {currentPlan?.macros?.grasas || '--'}g
            </p>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Meal Plan */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading font-bold text-foreground">
                  Plan de la Semana
                </h2>
                {hasActiveSubscription() && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {daysUntilExpiry()} días restantes
                  </span>
                )}
              </div>

              {currentPlan ? (
                <>
                  {/* Day Selector */}
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {(currentPlan.plan_data?.dias || []).map((dia, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedDay(index)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                          selectedDay === index 
                            ? 'bg-brand-green text-white' 
                            : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
                        }`}
                      >
                        {dia.dia}
                      </button>
                    ))}
                  </div>

                  {/* Meals List */}
                  <div className="space-y-4">
                    {todayMeals.map((meal, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          index % 2 === 0 ? 'bg-brand-green/10' : 'bg-brand-orange/10'
                        }`}>
                          <Utensils className={`w-5 h-5 ${index % 2 === 0 ? 'text-brand-green' : 'text-brand-orange'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {meal.tipo}
                            </span>
                            {meal.calorias && (
                              <span className="text-sm font-medium text-brand-orange">
                                {meal.calorias} kcal
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-foreground mb-1">{meal.nombre}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {Array.isArray(meal.ingredientes) 
                              ? meal.ingredientes.map(ing => 
                                  typeof ing === 'object' ? ing.item : ing
                                ).join(', ')
                              : ''
                            }
                          </p>
                          {meal.tip && (
                            <p className="text-xs text-brand-green mt-1 italic">💡 {meal.tip}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Sin plan activo</h3>
                  <p className="text-muted-foreground mb-4">
                    {questionnaire 
                      ? 'Genera tu primer plan alimenticio personalizado'
                      : 'Completa el cuestionario para comenzar'
                    }
                  </p>
                  <Button
                    onClick={() => questionnaire ? (hasActiveSubscription() ? generatePlan() : navigate('/precios')) : navigate('/cuestionario')}
                    className="bg-brand-green hover:bg-brand-green/90 rounded-full"
                  >
                    {questionnaire ? (hasActiveSubscription() ? 'Generar Plan' : 'Ver Planes') : 'Ir al Cuestionario'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommendations */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-heading font-bold text-foreground mb-4">
                Recomendaciones
              </h3>
              {currentPlan?.recommendations?.length > 0 ? (
                <ul className="space-y-3">
                  {currentPlan.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-brand-lime/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-brand-green">{index + 1}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Genera un plan para ver tus recomendaciones personalizadas
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-brand-green to-brand-green/80 rounded-3xl p-6 text-white">
              <h3 className="text-lg font-heading font-bold mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Link 
                  to="/progreso"
                  className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  data-testid="quick-action-progress"
                >
                  <span className="text-sm font-medium">Registrar mi peso</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/cuestionario"
                  className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <span className="text-sm font-medium">Actualizar cuestionario</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/historial"
                  className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <span className="text-sm font-medium">Ver planes anteriores</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link 
                  to="/precios"
                  className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <span className="text-sm font-medium">Gestionar suscripción</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
