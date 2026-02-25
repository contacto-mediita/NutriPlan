import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Questionnaire from "./pages/Questionnaire";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import History from "./pages/History";
import Progress from "./pages/Progress";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AdminPanel from "./pages/AdminPanel";
import "./App.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-green border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-green border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route path="/precios" element={<Pricing />} />
      <Route path="/terminos" element={<Terms />} />
      <Route path="/privacidad" element={<Privacy />} />
      <Route path="/cuestionario" element={<ProtectedRoute><Questionnaire /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      <Route path="/historial" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/progreso" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
