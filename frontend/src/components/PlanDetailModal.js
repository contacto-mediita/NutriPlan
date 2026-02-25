import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, ShoppingCart, Dumbbell, Home, Building2, 
  ChevronDown, ChevronUp, Clock, Repeat, Timer, Download, Loader2,
  Check, Star, Zap, DollarSign, Target, Flame, Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
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

// Exercise icons mapping
const EXERCISE_ICONS = {
  "Lagartijas": "💪",
  "Sentadillas": "🦵",
  "Plancha": "🧘",
  "Burpees": "🔥",
  "Zancadas": "🏃",
  "Fondos": "💪",
  "Press": "🏋️",
  "Curl": "💪",
  "Remo": "🚣",
  "Jalón": "🎯",
  "Mountain": "⛰️",
  "Jumping": "⭐",
  "Elevación": "⬆️",
  "Puente": "🌉",
  "Bicicleta": "🚴",
  "Superman": "🦸"
};

const getExerciseIcon = (name) => {
  for (const [key, icon] of Object.entries(EXERCISE_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  return "🏃";
};

const PlanDetailModal = ({ plan, isOpen, onClose }) => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [completedExercises, setCompletedExercises] = useState({});

  // Load saved state from localStorage
  useEffect(() => {
    if (plan?.id) {
      const savedCheckedItems = localStorage.getItem(`shopping_${plan.id}`);
      const savedExercises = localStorage.getItem(`exercises_${plan.id}`);
      if (savedCheckedItems) setCheckedItems(JSON.parse(savedCheckedItems));
      if (savedExercises) setCompletedExercises(JSON.parse(savedExercises));
    }
  }, [plan?.id]);

  // Save checked items to localStorage
  useEffect(() => {
    if (plan?.id && Object.keys(checkedItems).length > 0) {
      localStorage.setItem(`shopping_${plan.id}`, JSON.stringify(checkedItems));
    }
  }, [checkedItems, plan?.id]);

  // Save completed exercises to localStorage
  useEffect(() => {
    if (plan?.id && Object.keys(completedExercises).length > 0) {
      localStorage.setItem(`exercises_${plan.id}`, JSON.stringify(completedExercises));
    }
  }, [completedExercises, plan?.id]);

  if (!plan) return null;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/meal-plans/${plan.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Error al descargar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plan-alimenticio-${plan.id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('¡PDF descargado correctamente!');
    } catch (error) {
      console.error(error);
      toast.error('Error al descargar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  const toggleShoppingItem = (category, index) => {
    const key = `${category}-${index}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExercise = (routineType, dayIndex, exerciseIndex) => {
    const key = `${routineType}-${dayIndex}-${exerciseIndex}`;
    setCompletedExercises(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getShoppingProgress = () => {
    const total = Object.values(listaSuper).flat().length;
    const checked = Object.values(checkedItems).filter(Boolean).length;
    return { checked, total, percent: total > 0 ? Math.round((checked / total) * 100) : 0 };
  };

  const days = plan.plan_data?.dias || [];
  const listaSuper = plan.plan_data?.lista_super || {};
  const guiaEjercicios = plan.plan_data?.guia_ejercicios || {};
  const todayMeals = days[selectedDay]?.comidas || [];

  const categoryLabels = {
    proteinas: { label: 'Proteínas', icon: '🥩' },
    lacteos: { label: 'Lácteos', icon: '🥛' },
    cereales: { label: 'Cereales y Granos', icon: '🌾' },
    verduras: { label: 'Verduras', icon: '🥦' },
    frutas: { label: 'Frutas', icon: '🍎' },
    grasas_semillas: { label: 'Grasas y Semillas', icon: '🥜' },
    basicos: { label: 'Básicos', icon: '🧂' }
  };

  const optionLabels = {
    'Recomendado': { icon: Star, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    'Rápido': { icon: Zap, color: 'bg-blue-100 text-blue-700 border-blue-300' },
    'Económico': { icon: DollarSign, color: 'bg-green-100 text-green-700 border-green-300' }
  };

  // Check if plan has the new format with options
  const hasOptions = todayMeals.length > 0 && todayMeals[0]?.opciones;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-heading flex items-center gap-3">
              <Utensils className="w-7 h-7 text-brand-green" />
              Mi Plan Completo
            </DialogTitle>
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-brand-orange hover:bg-brand-orange/90 rounded-full"
              data-testid="download-pdf-btn"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {downloading ? 'Descargando...' : 'Descargar PDF'}
            </Button>
          </div>
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

            {/* Meals with Options */}
            <div className="space-y-4">
              {todayMeals.map((meal, mealIndex) => (
                <motion.div
                  key={mealIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mealIndex * 0.1 }}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedMeal(expandedMeal === mealIndex ? null : mealIndex)}
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
                        <h4 className="font-semibold text-foreground">
                          {hasOptions 
                            ? (meal.opciones?.[selectedOptions[`${selectedDay}-${mealIndex}`] || 0]?.nombre || meal.opciones?.[0]?.nombre)
                            : meal.nombre
                          }
                        </h4>
                        {hasOptions && (
                          <span className="text-xs text-brand-green">3 opciones disponibles</span>
                        )}
                      </div>
                    </div>
                    {expandedMeal === mealIndex ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedMeal === mealIndex && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 border-t border-gray-100"
                      >
                        {hasOptions ? (
                          // New format with 3 options
                          <div className="mt-4">
                            {/* Option Selector */}
                            <div className="flex gap-2 mb-4">
                              {meal.opciones?.map((opcion, optIndex) => {
                                const labelConfig = optionLabels[opcion.etiqueta] || optionLabels['Recomendado'];
                                const Icon = labelConfig.icon;
                                const isSelected = (selectedOptions[`${selectedDay}-${mealIndex}`] || 0) === optIndex;
                                
                                return (
                                  <button
                                    key={optIndex}
                                    onClick={() => setSelectedOptions(prev => ({
                                      ...prev,
                                      [`${selectedDay}-${mealIndex}`]: optIndex
                                    }))}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                      isSelected 
                                        ? labelConfig.color + ' ring-2 ring-offset-1'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                    }`}
                                  >
                                    <Icon className="w-3 h-3" />
                                    {opcion.etiqueta}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Selected Option Details */}
                            {(() => {
                              const currentOption = meal.opciones?.[selectedOptions[`${selectedDay}-${mealIndex}`] || 0];
                              if (!currentOption) return null;

                              return (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h5 className="font-bold text-foreground">{currentOption.nombre}</h5>
                                    {currentOption.tiempo_prep && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {currentOption.tiempo_prep}
                                      </span>
                                    )}
                                  </div>

                                  {/* Ingredientes */}
                                  <div>
                                    <h6 className="text-sm font-bold text-foreground mb-2">Ingredientes:</h6>
                                    <ul className="grid grid-cols-2 gap-2">
                                      {currentOption.ingredientes?.map((ing, i) => (
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
                                  {currentOption.preparacion && (
                                    <div>
                                      <h6 className="text-sm font-bold text-foreground mb-2">Preparación:</h6>
                                      <ol className="space-y-2">
                                        {currentOption.preparacion.map((paso, i) => (
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

                                  {/* Sustituciones */}
                                  {currentOption.sustituciones && currentOption.sustituciones.length > 0 && (
                                    <div className="bg-purple-50 p-3 rounded-xl">
                                      <h6 className="text-sm font-bold text-purple-700 mb-2">🔄 Sustituciones:</h6>
                                      <ul className="space-y-1">
                                        {currentOption.sustituciones.map((sub, i) => (
                                          <li key={i} className="text-xs text-purple-600">
                                            • {sub}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Tip */}
                                  {currentOption.tip && (
                                    <div className="bg-brand-green/5 p-3 rounded-xl">
                                      <p className="text-sm text-brand-green">
                                        💡 <strong>Tip NutriPlan:</strong> {currentOption.tip}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          // Old format without options
                          <div className="mt-4 space-y-4">
                            {/* Ingredientes */}
                            <div>
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
                              <div>
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
                              <div className="bg-brand-green/5 p-3 rounded-xl">
                                <p className="text-sm text-brand-green">
                                  💡 <strong>Tip:</strong> {meal.tip}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* LISTA SUPER TAB */}
          <TabsContent value="super" className="mt-6">
            <div className="bg-brand-orange/5 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-brand-orange" />
                  <div>
                    <h3 className="font-bold text-foreground">Lista de Compras</h3>
                    <p className="text-sm text-muted-foreground">
                      Todo lo que necesitas para tu plan de {days.length} días
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-orange">{getShoppingProgress().percent}%</p>
                  <p className="text-xs text-muted-foreground">
                    {getShoppingProgress().checked}/{getShoppingProgress().total} items
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3 h-2 bg-brand-orange/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getShoppingProgress().percent}%` }}
                  className="h-full bg-brand-orange rounded-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              {Object.entries(listaSuper).map(([category, items]) => {
                const catInfo = categoryLabels[category] || { label: category, icon: '📦' };
                const categoryChecked = (items || []).filter((_, i) => checkedItems[`${category}-${i}`]).length;
                
                return (
                  <div key={category} className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-foreground flex items-center gap-2">
                        <span>{catInfo.icon}</span>
                        {catInfo.label}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {categoryChecked}/{(items || []).length}
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(items || []).map((item, i) => {
                        const isChecked = checkedItems[`${category}-${i}`];
                        return (
                          <li 
                            key={i} 
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                              isChecked ? 'bg-green-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => toggleShoppingItem(category, i)}
                          >
                            <Checkbox
                              checked={isChecked}
                              className="data-[state=checked]:bg-brand-green data-[state=checked]:border-brand-green"
                            />
                            <span className={`text-sm ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                              {item}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
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
                    <p className="text-sm text-brand-green flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      <strong>Cardio recomendado:</strong> {guiaEjercicios.cardio_recomendado}
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

                  {['casa', 'gym'].map((routineType) => {
                    const routines = routineType === 'casa' 
                      ? guiaEjercicios.rutina_casa 
                      : guiaEjercicios.rutina_gimnasio;
                    
                    return (
                      <TabsContent key={routineType} value={routineType}>
                        <div className="space-y-4">
                          {(routines || []).map((rutina, dayIndex) => {
                            const completedCount = rutina.ejercicios?.filter((_, i) => 
                              completedExercises[`${routineType}-${dayIndex}-${i}`]
                            ).length || 0;
                            const totalExercises = rutina.ejercicios?.length || 0;
                            const progress = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

                            return (
                              <div key={dayIndex} className="bg-white border border-gray-100 rounded-2xl p-4">
                                {/* Routine Header */}
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-foreground">{rutina.dia}</h4>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {rutina.duracion}
                                    </span>
                                    <span className="text-xs font-medium text-purple-600">
                                      {completedCount}/{totalExercises}
                                    </span>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-purple-500 rounded-full"
                                  />
                                </div>

                                {/* Routine Description */}
                                {rutina.objetivo_rutina && (
                                  <div className="bg-purple-50 rounded-xl p-3 mb-3">
                                    <p className="text-sm text-purple-700 flex items-start gap-2">
                                      <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      <span><strong>Objetivo:</strong> {rutina.objetivo_rutina}</span>
                                    </p>
                                  </div>
                                )}

                                {/* Benefits */}
                                {rutina.beneficios && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {rutina.beneficios.map((benefit, i) => (
                                      <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                        ✓ {benefit}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Exercises with Checkboxes */}
                                <div className="space-y-2">
                                  {rutina.ejercicios?.map((ej, exIndex) => {
                                    const isCompleted = completedExercises[`${routineType}-${dayIndex}-${exIndex}`];
                                    
                                    return (
                                      <div 
                                        key={exIndex} 
                                        className={`flex items-center justify-between py-3 px-3 rounded-xl cursor-pointer transition-all ${
                                          isCompleted 
                                            ? 'bg-green-50 border border-green-200' 
                                            : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                        onClick={() => toggleExercise(routineType, dayIndex, exIndex)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Checkbox
                                            checked={isCompleted}
                                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                          />
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="text-lg">{getExerciseIcon(ej.nombre)}</span>
                                              <span className={`font-medium ${isCompleted ? 'text-green-700' : 'text-foreground'}`}>
                                                {ej.nombre}
                                              </span>
                                              {ej.musculo && (
                                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                                                  {ej.musculo}
                                                </span>
                                              )}
                                            </div>
                                            {ej.descripcion && (
                                              <p className="text-xs text-muted-foreground mt-0.5">{ej.descripcion}</p>
                                            )}
                                          </div>
                                        </div>
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
                                    );
                                  })}
                                </div>

                                {/* Routine Tips */}
                                {rutina.tips && (
                                  <div className="mt-3 bg-purple-50 p-2 rounded-lg">
                                    <p className="text-xs text-purple-700">💪 {rutina.tips}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    );
                  })}
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
