import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Utensils, ShoppingCart, Dumbbell, Home, Building2, 
  ChevronDown, ChevronUp, Clock, Repeat, Timer, X, Download, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PlanDetailModal = ({ plan, isOpen, onClose }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [downloading, setDownloading] = useState(false);

  if (!plan) return null;

  const days = plan.plan_data?.dias || [];
  const listaSuper = plan.plan_data?.lista_super || {};
  const guiaEjercicios = plan.plan_data?.guia_ejercicios || {};
  const todayMeals = days[selectedDay]?.comidas || [];

  const categoryLabels = {
    proteinas: '🥩 Proteínas',
    lacteos: '🥛 Lácteos',
    cereales: '🌾 Cereales y Granos',
    verduras: '🥦 Verduras',
    frutas: '🍎 Frutas',
    grasas_semillas: '🥜 Grasas y Semillas',
    basicos: '🧂 Básicos'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading flex items-center gap-3">
            <Utensils className="w-7 h-7 text-brand-green" />
            Mi Plan Completo
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="menu" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Menú
            </TabsTrigger>
            <TabsTrigger value="super" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Lista Super
            </TabsTrigger>
            <TabsTrigger value="ejercicios" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Ejercicios
            </TabsTrigger>
          </TabsList>

          {/* MENÚ TAB */}
          <TabsContent value="menu" className="mt-6">
            {/* Macros Summary */}
            <div className="bg-brand-green/5 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Calorías/día</p>
                  <p className="text-xl font-bold text-brand-green">{plan.calories_target}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Proteínas</p>
                  <p className="text-lg font-bold text-foreground">{plan.macros?.proteinas}g</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Carbohidratos</p>
                  <p className="text-lg font-bold text-foreground">{plan.macros?.carbohidratos}g</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Grasas</p>
                  <p className="text-lg font-bold text-foreground">{plan.macros?.grasas}g</p>
                </div>
              </div>
            </div>

            {/* Day Selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {days.map((dia, index) => (
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

            {/* Meals */}
            <div className="space-y-4">
              {todayMeals.map((meal, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedMeal(expandedMeal === index ? null : index)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        meal.tipo === 'Desayuno' ? 'bg-yellow-100' :
                        meal.tipo === 'Comida' ? 'bg-brand-green/10' :
                        meal.tipo === 'Snack' ? 'bg-purple-100' :
                        'bg-blue-100'
                      }`}>
                        <Utensils className={`w-5 h-5 ${
                          meal.tipo === 'Desayuno' ? 'text-yellow-600' :
                          meal.tipo === 'Comida' ? 'text-brand-green' :
                          meal.tipo === 'Snack' ? 'text-purple-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-muted-foreground uppercase block">
                          {meal.tipo}
                        </span>
                        <h4 className="font-semibold text-foreground">{meal.nombre}</h4>
                      </div>
                    </div>
                    {expandedMeal === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedMeal === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="px-4 pb-4 border-t border-gray-100"
                    >
                      {/* Ingredientes */}
                      <div className="mt-4">
                        <h5 className="text-sm font-bold text-foreground mb-2">Ingredientes:</h5>
                        <ul className="grid grid-cols-2 gap-2">
                          {meal.ingredientes?.map((ing, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="w-2 h-2 bg-brand-green rounded-full"></span>
                              {typeof ing === 'object' 
                                ? `${ing.item} - ${ing.cantidad}`
                                : ing
                              }
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Preparación */}
                      {meal.preparacion && (
                        <div className="mt-4">
                          <h5 className="text-sm font-bold text-foreground mb-2">Preparación:</h5>
                          <ol className="space-y-2">
                            {meal.preparacion.map((paso, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="bg-brand-orange text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                {paso}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Tip */}
                      {meal.tip && (
                        <div className="mt-4 bg-brand-green/5 p-3 rounded-xl">
                          <p className="text-sm text-brand-green">
                            💡 <strong>Tip:</strong> {meal.tip}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* LISTA SUPER TAB */}
          <TabsContent value="super" className="mt-6">
            <div className="bg-brand-orange/5 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-brand-orange" />
                <div>
                  <h3 className="font-bold text-foreground">Lista de Compras</h3>
                  <p className="text-sm text-muted-foreground">
                    Todo lo que necesitas para tu plan de {days.length} días
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(listaSuper).map(([category, items]) => (
                <div key={category} className="bg-white border border-gray-100 rounded-2xl p-4">
                  <h4 className="font-bold text-foreground mb-3">
                    {categoryLabels[category] || category}
                  </h4>
                  <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(items || []).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* EJERCICIOS TAB */}
          <TabsContent value="ejercicios" className="mt-6">
            {guiaEjercicios.descripcion ? (
              <>
                <div className="bg-purple-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-6 h-6 text-purple-600" />
                    <div>
                      <h3 className="font-bold text-foreground">{guiaEjercicios.descripcion}</h3>
                      <p className="text-sm text-muted-foreground">
                        {guiaEjercicios.dias_recomendados} días a la semana recomendados
                      </p>
                    </div>
                  </div>
                </div>

                {guiaEjercicios.cardio_recomendado && (
                  <div className="bg-brand-green/5 rounded-xl p-4 mb-6">
                    <p className="text-sm text-brand-green">
                      <strong>🏃 Cardio recomendado:</strong> {guiaEjercicios.cardio_recomendado}
                    </p>
                  </div>
                )}

                <Tabs defaultValue="casa" className="mt-4">
                  <TabsList className="grid grid-cols-2 w-full max-w-xs mx-auto mb-4">
                    <TabsTrigger value="casa" className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      En Casa
                    </TabsTrigger>
                    <TabsTrigger value="gym" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Gimnasio
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="casa">
                    <div className="space-y-4">
                      {(guiaEjercicios.rutina_casa || []).map((rutina, index) => (
                        <div key={index} className="bg-white border border-gray-100 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-foreground">{rutina.dia}</h4>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {rutina.duracion}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {rutina.ejercicios?.map((ej, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <span className="font-medium text-foreground">{ej.nombre}</span>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Repeat className="w-3 h-3" />
                                    {ej.series}x{ej.repeticiones}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {ej.descanso}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {rutina.tips && (
                            <div className="mt-3 bg-purple-50 p-2 rounded-lg">
                              <p className="text-xs text-purple-700">💪 {rutina.tips}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="gym">
                    <div className="space-y-4">
                      {(guiaEjercicios.rutina_gimnasio || []).map((rutina, index) => (
                        <div key={index} className="bg-white border border-gray-100 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-foreground">{rutina.dia}</h4>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {rutina.duracion}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {rutina.ejercicios?.map((ej, i) => (
                              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <span className="font-medium text-foreground">{ej.nombre}</span>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Repeat className="w-3 h-3" />
                                    {ej.series}x{ej.repeticiones}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {ej.descanso}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {rutina.tips && (
                            <div className="mt-3 bg-purple-50 p-2 rounded-lg">
                              <p className="text-xs text-purple-700">💪 {rutina.tips}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Guía de ejercicios no disponible para este plan
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PlanDetailModal;
