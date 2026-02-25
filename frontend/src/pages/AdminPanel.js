import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, CreditCard, Utensils, TrendingUp, Search, 
  ChevronRight, Calendar, Mail, Phone, Target, Scale,
  RefreshCw, AlertCircle, CheckCircle, Clock, DollarSign,
  BarChart3, UserCheck, FileText, Activity
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [usersTotal, setUsersTotal] = useState(0);
  const [paymentsTotal, setPaymentsTotal] = useState(0);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const res = await axios.get(`${API}/admin/check`);
      if (res.data.is_admin) {
        setIsAdmin(true);
        fetchAllData();
      } else {
        toast.error('No tienes permisos de administrador');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const [statsRes, usersRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/users?limit=10`),
        axios.get(`${API}/admin/payments?limit=10`)
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setUsersTotal(usersRes.data.total);
      setPayments(paymentsRes.data.payments);
      setPaymentsTotal(paymentsRes.data.total);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar datos');
    }
  };

  const searchUsers = async () => {
    try {
      const res = await axios.get(`${API}/admin/users?search=${searchTerm}`);
      setUsers(res.data.users);
      setUsersTotal(res.data.total);
    } catch (error) {
      toast.error('Error en búsqueda');
    }
  };

  const viewUserDetail = async (userId) => {
    try {
      const res = await axios.get(`${API}/admin/users/${userId}`);
      setSelectedUser(res.data);
    } catch (error) {
      toast.error('Error al cargar usuario');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground">
              Gestiona usuarios, pagos y estadísticas
            </p>
          </div>
          <Button
            onClick={fetchAllData}
            variant="outline"
            className="rounded-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Usuarios</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total_users}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{stats.recent_signups} últimos 7 días
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Suscripciones Activas</p>
                  <p className="text-2xl font-bold text-foreground">{stats.active_subscriptions}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-muted-foreground">
                  {((stats.active_subscriptions / stats.total_users) * 100).toFixed(1)}% de conversión
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Planes Generados</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total_plans_generated}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-muted-foreground">
                  {stats.questionnaire_completion_rate}% completaron cuestionario
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-foreground">{formatMoney(stats.total_revenue)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-muted-foreground">
                  Promedio: {formatMoney(stats.total_revenue / (stats.active_subscriptions || 1))}/usuario
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-white rounded-2xl shadow-sm">
              {/* Search */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                    className="max-w-md"
                  />
                  <Button onClick={searchUsers} variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {usersTotal} usuarios encontrados
                </p>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Suscripción</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cuestionario</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Planes</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Registro</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{u.name}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.subscription_type === 'monthly' ? 'bg-green-100 text-green-700' :
                            u.subscription_type === 'trial' ? 'bg-blue-100 text-blue-700' :
                            u.subscription_type ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.subscription_type || 'Sin plan'}
                          </span>
                        </td>
                        <td className="p-4">
                          {u.has_questionnaire ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-300" />
                          )}
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-foreground">{u.plans_count}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{formatDate(u.created_at)}</span>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewUserDetail(u.id)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <p className="text-sm text-muted-foreground">{paymentsTotal} transacciones</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Plan</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Monto</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{p.user?.name || '--'}</p>
                            <p className="text-sm text-muted-foreground">{p.user?.email || '--'}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium text-foreground">{p.plan_type}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-bold text-foreground">{formatMoney(p.amount)}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                            p.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {p.payment_status}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{formatDate(p.created_at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subscriptions by Type */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4">Usuarios por Suscripción</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.users_by_subscription).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-foreground capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-green rounded-full"
                              style={{ width: `${(count / stats.total_users) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plans by Type */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4">Planes por Tipo</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.plans_by_type).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-foreground capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-orange rounded-full"
                              style={{ width: `${(count / stats.total_plans_generated) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="bg-white rounded-2xl p-6 shadow-sm md:col-span-2">
                  <h3 className="text-lg font-bold text-foreground mb-4">Métricas Clave</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-brand-green">
                        {((stats.active_subscriptions / stats.total_users) * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-brand-orange">
                        {stats.questionnaire_completion_rate}%
                      </p>
                      <p className="text-sm text-muted-foreground">Cuestionarios Completados</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-purple-600">
                        {(stats.total_plans_generated / stats.total_users).toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Planes/Usuario</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-3xl font-bold text-blue-600">
                        {formatMoney(stats.total_revenue / (stats.active_subscriptions || 1))}
                      </p>
                      <p className="text-sm text-muted-foreground">ARPU</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* User Detail Modal */}
        {selectedUser && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{selectedUser.user.name}</h2>
                    <p className="text-muted-foreground">{selectedUser.user.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    ✕
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Subscription Info */}
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-2">Suscripción</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p><strong>Tipo:</strong> {selectedUser.user.subscription_type || 'Sin plan'}</p>
                    <p><strong>Expira:</strong> {formatDate(selectedUser.user.subscription_expires)}</p>
                  </div>
                </div>

                {/* Questionnaire */}
                {selectedUser.questionnaire && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-2">Cuestionario</h3>
                    <div className="bg-gray-50 rounded-xl p-4 text-sm">
                      <p><strong>Peso:</strong> {selectedUser.questionnaire.data?.peso}kg</p>
                      <p><strong>Estatura:</strong> {selectedUser.questionnaire.data?.estatura}cm</p>
                      <p><strong>Objetivo:</strong> {selectedUser.questionnaire.data?.objetivo_principal}</p>
                      <p><strong>Ejercicio:</strong> {selectedUser.questionnaire.data?.dias_ejercicio} días/semana</p>
                    </div>
                  </div>
                )}

                {/* Progress */}
                {selectedUser.progress?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-2">Progreso Reciente</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex gap-2 flex-wrap">
                        {selectedUser.progress.slice(0, 5).map((p, i) => (
                          <span key={i} className="px-2 py-1 bg-white rounded text-sm">
                            {p.weight}kg ({formatDate(p.date)})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Payments */}
                {selectedUser.payments?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-2">Pagos</h3>
                    <div className="space-y-2">
                      {selectedUser.payments.map((p, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                          <span className="text-sm">{p.plan_type}</span>
                          <span className="font-bold">{formatMoney(p.amount)}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            p.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {p.payment_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
