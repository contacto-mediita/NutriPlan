import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import confetti from '../utils/confetti';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [attempts, setAttempts] = useState(0);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('error');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        await refreshUser();
        confetti();
      } else if (response.data.status === 'expired') {
        setStatus('error');
      } else {
        setAttempts(prev => prev + 1);
        setTimeout(pollPaymentStatus, pollInterval);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-12 shadow-xl max-w-md w-full text-center"
        data-testid="payment-result"
      >
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-brand-green animate-spin" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Verificando tu pago...
            </h1>
            <p className="text-muted-foreground mb-6">
              Por favor espera mientras confirmamos tu transacción
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-brand-green"
                initial={{ width: '0%' }}
                animate={{ width: `${(attempts / 10) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-brand-green" />
            </motion.div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              ¡Pago Exitoso!
            </h1>
            <p className="text-muted-foreground mb-8">
              Tu suscripción ha sido activada. Ya puedes generar tu plan alimenticio personalizado.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-brand-orange hover:bg-brand-orange/90 rounded-full py-6 text-lg font-bold"
                data-testid="go-to-dashboard-btn"
              >
                Ir al Dashboard
              </Button>
              <Button
                onClick={() => navigate('/cuestionario')}
                variant="outline"
                className="w-full rounded-full"
              >
                Completar Cuestionario
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
              Error en el Pago
            </h1>
            <p className="text-muted-foreground mb-8">
              Hubo un problema al procesar tu pago. Por favor intenta nuevamente.
            </p>
            <Button
              onClick={() => navigate('/precios')}
              className="w-full bg-brand-orange hover:bg-brand-orange/90 rounded-full py-6 text-lg font-bold"
            >
              Volver a Intentar
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
