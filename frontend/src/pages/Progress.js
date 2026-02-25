import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, TrendingUp, Minus, Plus, Calendar, 
  Target, Scale, Trash2, LineChart, Award
} from 'lucide-react';
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import axios from 'axios';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Progress = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [customGoal, setCustomGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [goalWeight, setGoalWeight] = useState('');
  const [goalType, setGoalType] = useState('bajar');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, statsRes, goalRes] = await Promise.all([
        axios.get(`${API}/progress/weight`),
        axios.get(`${API}/progress/stats`),
        axios.get(`${API}/progress/goal`)
      ]);
      setRecords(recordsRes.data);
      setStats(statsRes.data);
      setCustomGoal(goalRes.data);
      
      // Pre-fill goal form with current values
      if (goalRes.data.target_weight) {
        setGoalWeight(goalRes.data.target_weight.toString());
        setGoalType(goalRes.data.goal_type || 'bajar');
      } else if (statsRes.data.target_weight) {
        setGoalWeight(statsRes.data.target_weight.toString());
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    if (!goalWeight) return;

    setSubmitting(true);
    try {
      await axios.put(`${API}/progress/goal`, {
        target_weight: parseFloat(goalWeight),
        goal_type: goalType
      });
      toast.success('¡Meta actualizada!');
      setShowGoalModal(false);
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar meta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!newWeight) return;

    setSubmitting(true);
    try {
      await axios.post(`${API}/progress/weight`, {
        weight: parseFloat(newWeight),
        date: newDate,
        notes: newNotes || null
      });
      toast.success('¡Peso registrado!');
      setShowAddModal(false);
      setNewWeight('');
      setNewNotes('');
      fetchData();
    } catch (error) {
      toast.error('Error al registrar peso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      await axios.delete(`${API}/progress/weight/${recordId}`);
      toast.success('Registro eliminado');
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar registro');
    }
  };

  const getTrendIcon = () => {
    if (!stats?.weight_change) return <Minus className="w-5 h-5 text-gray-400" />;
    if (stats.weight_change < 0) {
      return stats.goal?.toLowerCase().includes('bajar') 
        ? <TrendingDown className="w-5 h-5 text-brand-green" />
        : <TrendingDown className="w-5 h-5 text-red-500" />;
    }
    return stats.goal?.toLowerCase().includes('aumentar') || stats.goal?.toLowerCase().includes('masa')
      ? <TrendingUp className="w-5 h-5 text-brand-green" />
      : <TrendingUp className="w-5 h-5 text-red-500" />;
  };

  const getProgressPercentage = () => {
    if (!stats?.initial_weight || !stats?.target_weight || !stats?.current_weight) return 0;
    const totalChange = Math.abs(stats.target_weight - stats.initial_weight);
    const currentChange = Math.abs(stats.current_weight - stats.initial_weight);
    if (totalChange === 0) return 100;
    return Math.min(100, Math.round((currentChange / totalChange) * 100));
  };

  const chartData = records.map(r => ({
    date: new Date(r.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    peso: r.weight,
    fullDate: r.date
  }));

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
      
      <div className="max-w-6xl mx-auto px-6 py-8" data-testid="progress-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Mi Progreso</h1>
            <p className="text-muted-foreground">Seguimiento de tu evolución</p>
          </div>
          
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="bg-brand-orange hover:bg-brand-orange/90 rounded-full" data-testid="add-weight-btn">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Peso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-brand-green" />
                  Registrar Peso
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddWeight} className="space-y-4 pt-4">
                <div>
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="70.5"
                    className="h-12 rounded-xl mt-1"
                    required
                    data-testid="input-weight"
                  />
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-12 rounded-xl mt-1"
                    data-testid="input-date"
                  />
                </div>
                <div>
                  <Label>Notas (opcional)</Label>
                  <Input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Ej: Después de entrenar"
                    className="h-12 rounded-xl mt-1"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-brand-green hover:bg-brand-green/90 rounded-full h-12"
                  data-testid="submit-weight-btn"
                >
                  {submitting ? 'Guardando...' : 'Guardar Registro'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-brand-green" />
              <span className="text-sm text-muted-foreground">Peso Inicial</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {stats?.initial_weight ? `${stats.initial_weight} kg` : '--'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <LineChart className="w-5 h-5 text-brand-orange" />
              <span className="text-sm text-muted-foreground">Peso Actual</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {stats?.current_weight ? `${stats.current_weight} kg` : '--'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Meta</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">
              {stats?.target_weight ? `${stats.target_weight} kg` : '--'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              {getTrendIcon()}
              <span className="text-sm text-muted-foreground">Cambio</span>
            </div>
            <p className={`text-2xl font-heading font-bold ${
              stats?.weight_change 
                ? (stats.weight_change < 0 ? 'text-brand-green' : 'text-brand-orange')
                : 'text-foreground'
            }`}>
              {stats?.weight_change 
                ? `${stats.weight_change > 0 ? '+' : ''}${stats.weight_change} kg`
                : '--'
              }
            </p>
          </motion.div>
        </div>

        {/* Progress Bar */}
        {stats?.initial_weight && stats?.target_weight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Progreso hacia tu meta</h3>
              <span className="text-sm font-medium text-brand-green">{getProgressPercentage()}%</span>
            </div>
            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute h-full bg-gradient-to-r from-brand-green to-brand-lime rounded-full"
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{stats.initial_weight} kg</span>
              <span className="font-medium text-brand-green">{stats.target_weight} kg</span>
            </div>
          </motion.div>
        )}

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm mb-8"
        >
          <h3 className="text-lg font-heading font-bold text-foreground mb-6">Evolución de Peso</h3>
          
          {chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLine data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `${value} kg`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value} kg`, 'Peso']}
                  />
                  {stats?.target_weight && (
                    <ReferenceLine 
                      y={stats.target_weight} 
                      stroke="#608A1C" 
                      strokeDasharray="5 5"
                      label={{ value: 'Meta', position: 'right', fill: '#608A1C', fontSize: 12 }}
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#FF7F2A" 
                    strokeWidth={3}
                    dot={{ fill: '#FF7F2A', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, fill: '#FF7F2A' }}
                  />
                </RechartsLine>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <LineChart className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground mb-2">Sin registros aún</p>
              <p className="text-sm text-muted-foreground">Agrega tu primer peso para ver tu progreso</p>
            </div>
          )}
        </motion.div>

        {/* Records List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-heading font-bold text-foreground mb-4">Historial de Registros</h3>
          
          {records.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {[...records].reverse().map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-orange/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-brand-orange" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{record.weight} kg</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.date).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{record.notes}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRecord(record.id)}
                    className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    data-testid={`delete-record-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay registros de peso aún</p>
            </div>
          )}
        </motion.div>

        {/* Motivation Card */}
        {stats?.weight_change && Math.abs(stats.weight_change) >= 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-gradient-to-r from-brand-green to-brand-lime rounded-3xl p-6 text-white"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold">¡Felicidades!</h3>
                <p className="text-white/80">
                  {stats.weight_change < 0 
                    ? `Has perdido ${Math.abs(stats.weight_change)} kg. ¡Sigue así!`
                    : `Has ganado ${stats.weight_change} kg. ¡Buen trabajo!`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Progress;
