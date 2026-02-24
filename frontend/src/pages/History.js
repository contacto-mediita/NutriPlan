import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Utensils, Trash2 } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const History = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/meal-plans`);
      setPlans(response.data);
      if (response.data.length > 0) {
        setSelectedPlan(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-green border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8" data-testid="history-page">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Historial de Planes</h1>
          <p className="text-muted-foreground">Revisa tus planes alimenticios anteriores</p>
        </div>

        {plans.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Sin planes aún</h3>
            <p className="text-muted-foreground">Genera tu primer plan para verlo aquí</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Plans List */}
            <div className="space-y-4">
              {plans.map((plan, index) => (
                <motion.button
                  key={plan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full text-left p-4 rounded-2xl transition-all ${
                    selectedPlan?.id === plan.id 
                      ? 'bg-brand-green text-white shadow-lg' 
                      : 'bg-white hover:shadow-md'
                  }`}
                  data-testid={`plan-item-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-semibold ${selectedPlan?.id === plan.id ? 'text-white' : 'text-foreground'}`}>
                        Plan {plan.plan_type === 'monthly' ? 'Mensual' : 'Semanal'}
                      </p>
                      <p className={`text-sm ${selectedPlan?.id === plan.id ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {new Date(plan.created_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${selectedPlan?.id === plan.id ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Plan Detail */}
            {selectedPlan && (
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-foreground">
                      Plan del {new Date(selectedPlan.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long'
                      })}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlan.calories_target} kcal/día • {selectedPlan.macros?.proteinas}g proteína
                    </p>
                  </div>
                </div>

                {/* Days accordion */}
                <div className="space-y-4">
                  {(selectedPlan.plan_data?.dias || []).map((dia, dayIndex) => (
                    <details key={dayIndex} className="group" open={dayIndex === 0}>
                      <summary className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <span className="font-semibold text-foreground">{dia.dia}</span>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="mt-2 space-y-2 pl-4">
                        {dia.comidas?.map((meal, mealIndex) => (
                          <div key={mealIndex} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                            <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Utensils className="w-5 h-5 text-brand-green" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">{meal.tipo}</span>
                                <span className="text-xs font-medium text-brand-orange">{meal.calorias} kcal</span>
                              </div>
                              <p className="font-medium text-foreground text-sm">{meal.nombre}</p>
                              <p className="text-xs text-muted-foreground truncate">{meal.ingredientes?.join(', ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>

                {/* Recommendations */}
                {selectedPlan.recommendations?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="font-semibold text-foreground mb-3">Recomendaciones</h3>
                    <ul className="space-y-2">
                      {selectedPlan.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-brand-green font-bold">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
