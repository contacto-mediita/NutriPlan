import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Leaf, Target, Utensils, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: "Personalizado para Ti",
      description: "Planes basados en tus objetivos, condiciones de salud y preferencias alimenticias."
    },
    {
      icon: Leaf,
      title: "100% Natural",
      description: "Recetas con ingredientes frescos y nutritivos, adaptadas a tu presupuesto."
    },
    {
      icon: Heart,
      title: "Respaldado por IA",
      description: "Tecnología avanzada que considera todos tus factores para el plan perfecto."
    }
  ];

  const steps = [
    { number: "01", title: "Completa el Cuestionario", description: "8 sencillas etapas sobre ti y tus hábitos" },
    { number: "02", title: "Recibe tu Plan", description: "La IA genera tu plan alimenticio único" },
    { number: "03", title: "Transforma tu Vida", description: "Sigue tu plan y alcanza tus metas" }
  ];

  const benefits = [
    "Plan semanal completo con 5 comidas diarias",
    "Ajustado a tus calorías y macros",
    "Considera alergias y preferencias",
    "Recomendaciones personalizadas",
    "Actualización según tu progreso"
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cream to-white"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-brand-lime/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-orange/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 bg-brand-green/10 text-brand-green px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                Nutrición Inteligente
              </span>
              
              <h1 className="text-5xl lg:text-7xl font-heading font-extrabold tracking-tight mb-6">
                <span className="text-foreground">Transforma</span>
                <br />
                <span className="text-gradient">tu Cuerpo</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                Planes alimenticios personalizados por IA. Come rico, pierde peso y alcanza la 
                <span className="font-accent text-2xl text-brand-orange ml-2">mejor versión de ti</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(user ? '/cuestionario' : '/auth')}
                  className="btn-primary flex items-center justify-center gap-2 text-lg"
                  data-testid="hero-cta-btn"
                >
                  ¡Comienza Hoy!
                  <ArrowRight className="w-5 h-5" />
                </button>
                <Link 
                  to="/precios" 
                  className="btn-secondary flex items-center justify-center gap-2"
                  data-testid="hero-pricing-btn"
                >
                  Ver Precios
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.pexels.com/photos/4099235/pexels-photo-4099235.jpeg"
                  alt="Comida saludable"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              
              <motion.div 
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-brand-green" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">+5,000</p>
                    <p className="text-sm text-muted-foreground">Planes creados</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-brand-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-4">
              ¿Por qué <span className="text-gradient">elegirnos</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Combinamos ciencia nutricional con inteligencia artificial para crear el plan perfecto para ti
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-feature group"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-green/20 transition-colors">
                  <feature.icon className="w-8 h-8 text-brand-green" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-4">
              ¿Cómo <span className="text-gradient">funciona</span>?
            </h2>
            <p className="text-lg text-muted-foreground">Tres simples pasos para transformar tu alimentación</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-8xl font-heading font-extrabold text-brand-green/10 mb-4">{step.number}</div>
                <h3 className="text-xl font-heading font-bold mb-2 -mt-12">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 right-0 w-1/2 h-0.5 bg-gradient-to-r from-brand-green/30 to-transparent"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-brand-green relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-white"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
                Todo lo que necesitas para alcanzar tus metas
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 text-white/90"
                  >
                    <CheckCircle2 className="w-5 h-5 text-brand-lime flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
              
              <button
                onClick={() => navigate(user ? '/cuestionario' : '/auth')}
                className="mt-8 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-full px-8 py-4 font-bold shadow-lg transform hover:-translate-y-1 transition-all flex items-center gap-2"
                data-testid="benefits-cta-btn"
              >
                ¡Empieza Ahora!
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img 
                src="https://images.pexels.com/photos/8346681/pexels-photo-8346681.jpeg"
                alt="Estilo de vida saludable"
                className="rounded-3xl shadow-2xl w-full h-[400px] object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-6">
              ¿Listo para <span className="text-gradient">transformarte</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Únete a miles de personas que ya están mejorando su alimentación con nuestros planes personalizados.
            </p>
            <button
              onClick={() => navigate(user ? '/cuestionario' : '/auth')}
              className="btn-primary text-xl px-12 py-5 animate-pulse-glow"
              data-testid="final-cta-btn"
            >
              ¡Comienza tu Transformación!
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Utensils className="w-8 h-8 text-brand-lime" />
              <span className="text-xl font-heading font-bold text-white">NutriPlan</span>
            </div>
            <p className="text-white/60 text-sm">
              © 2024 NutriPlan. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
