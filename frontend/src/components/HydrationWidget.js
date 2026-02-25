import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus, Minus, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from './ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HydrationWidget = () => {
  const [glasses, setGlasses] = useState(0);
  const [goal, setGoal] = useState({ daily_glasses: 8, daily_ml: 2000, weight_kg: 70, goal: 'general' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [goalRes, todayRes] = await Promise.all([
        axios.get(`${API}/hydration/goal`),
        axios.get(`${API}/hydration/today`)
      ]);
      setGoal(goalRes.data);
      setGlasses(todayRes.data.glasses || 0);
    } catch (error) {
      console.error('Error fetching hydration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGlasses = async (newValue) => {
    const clampedValue = Math.max(0, Math.min(newValue, goal.daily_glasses + 5));
    setGlasses(clampedValue);
    
    try {
      await axios.post(`${API}/hydration/log`, {
        glasses: clampedValue,
        date: new Date().toISOString().split('T')[0]
      });
      
      if (clampedValue === goal.daily_glasses) {
        toast.success('🎉 ¡Felicidades! Completaste tu meta de agua hoy');
      }
    } catch (error) {
      console.error('Error logging hydration:', error);
    }
  };

  const progress = Math.min((glasses / goal.daily_glasses) * 100, 100);
  const mlConsumed = glasses * 250;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 animate-pulse">
        <div className="h-32"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Hidratación</h3>
            <p className="text-xs text-muted-foreground">Meta: {goal.daily_glasses} vasos ({(goal.daily_ml / 1000).toFixed(1)}L)</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{glasses}/{goal.daily_glasses}</p>
          <p className="text-xs text-muted-foreground">{mlConsumed}ml</p>
        </div>
      </div>

      {/* Visual Glasses Display */}
      <div className="flex justify-center gap-1 mb-4 flex-wrap">
        {Array.from({ length: goal.daily_glasses }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`relative w-6 h-10 rounded-b-lg border-2 transition-all cursor-pointer ${
              index < glasses 
                ? 'bg-blue-400 border-blue-500' 
                : 'bg-white/50 border-blue-200'
            }`}
            onClick={() => updateGlasses(index + 1)}
            data-testid={`water-glass-${index}`}
          >
            {index < glasses && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-b-md"
                style={{ 
                  background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 1) 100%)'
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-blue-100 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateGlasses(glasses - 1)}
          disabled={glasses <= 0}
          className="rounded-full border-blue-200 hover:bg-blue-50"
          data-testid="hydration-minus-btn"
        >
          <Minus className="w-4 h-4 text-blue-600" />
        </Button>
        
        <Button
          onClick={() => updateGlasses(glasses + 1)}
          className="bg-blue-500 hover:bg-blue-600 rounded-full px-6"
          data-testid="hydration-plus-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar vaso
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => updateGlasses(0)}
          className="rounded-full border-blue-200 hover:bg-blue-50"
          data-testid="hydration-reset-btn"
        >
          <Target className="w-4 h-4 text-blue-600" />
        </Button>
      </div>

      {/* Goal Info */}
      <div className="mt-4 pt-4 border-t border-blue-100">
        <p className="text-xs text-center text-muted-foreground">
          <TrendingUp className="w-3 h-3 inline mr-1" />
          Meta calculada para {goal.weight_kg}kg y objetivo: {goal.goal || 'general'}
        </p>
      </div>
    </motion.div>
  );
};

export default HydrationWidget;
