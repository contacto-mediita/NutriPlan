import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Target, Activity, Heart, AlertCircle, Wine, Utensils, MapPin, Check, ShieldCheck, FileText } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Progress } from '../components/ui/progress';
import Navbar from '../components/Navbar';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ETAPAS = [
  { id: 0, title: "Aviso Legal", icon: ShieldCheck, color: "bg-gray-700" },
  { id: 1, title: "Datos Generales", icon: User, color: "bg-blue-500" },
  { id: 2, title: "Objetivos", icon: Target, color: "bg-brand-orange" },
  { id: 3, title: "Actividad y Rutina", icon: Activity, color: "bg-brand-green" },
  { id: 4, title: "Salud", icon: Heart, color: "bg-red-500" },
  { id: 5, title: "Síntomas", icon: AlertCircle, color: "bg-yellow-500" },
  { id: 6, title: "Hábitos", icon: Wine, color: "bg-purple-500" },
  { id: 7, title: "Alimentación", icon: Utensils, color: "bg-brand-lime" },
  { id: 8, title: "Consumo Fuera", icon: MapPin, color: "bg-teal-500" }
];

const PADECIMIENTOS = [
  "Diabetes", "Hipertensión", "Colesterol alto", "Triglicéridos altos",
  "Hipotiroidismo", "Hipertiroidismo", "Gastritis", "Colitis",
  "Reflujo", "Síndrome de intestino irritable", "Enfermedad celíaca",
  "Ninguno"
];

const SINTOMAS = [
  "Fatiga o cansancio", "Dolor de cabeza frecuente", "Hinchazón abdominal",
  "Estreñimiento", "Diarrea", "Acidez estomacal", "Náuseas",
  "Retención de líquidos", "Ansiedad por comer", "Insomnio",
  "Falta de energía", "Ninguno"
];

const ALERGIAS = [
  "Gluten", "Lactosa", "Mariscos", "Frutos secos", "Huevo",
  "Soya", "Maní", "Ninguna"
];

const Questionnaire = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [formData, setFormData] = useState({
    // Etapa 1
    nombre: user?.name || '',
    edad: '',
    fecha_nacimiento: '',
    sexo: '',
    estatura: '',
    peso: '',
    // Etapa 2
    objetivo_principal: '',
    objetivos_secundarios: [],
    // Etapa 3
    trabajo_oficina: false,
    trabajo_fisico: false,
    labores_hogar: false,
    turnos_rotativos: false,
    ejercicio_adicional: '',
    dias_ejercicio: 0,
    // Etapa 4
    padecimientos: [],
    medicamentos_controlados: false,
    // Etapa 5
    sintomas: [],
    // Etapa 6
    fuma: false,
    consume_alcohol: false,
    frecuencia_alcohol: '',
    // Etapa 7
    alergias: [],
    vegetariano: false,
    alimentos_no_deseados: '',
    desayuno_tipico: '',
    comida_tipica: '',
    cena_tipica: '',
    platillo_favorito: '',
    // Etapa 8
    frecuencia_restaurantes: '',
    ticket_promedio: ''
  });

  const progress = ((currentStep + 1) / ETAPAS.length) * 100;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...arr, item] };
    });
  };

  const handleNext = () => {
    // Validar aceptación de términos en paso 0
    if (currentStep === 0 && !termsAccepted) {
      toast.error('Debes aceptar los términos para continuar');
      return;
    }
    
    if (currentStep < ETAPAS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleDecline = () => {
    toast.error('Debes aceptar los términos para usar el servicio');
    navigate('/');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        edad: parseInt(formData.edad) || 0,
        estatura: parseFloat(formData.estatura) || 0,
        peso: parseFloat(formData.peso) || 0,
        dias_ejercicio: parseInt(formData.dias_ejercicio) || 0,
        ticket_promedio: parseFloat(formData.ticket_promedio) || 0,
        alimentos_no_deseados: formData.alimentos_no_deseados.split(',').map(s => s.trim()).filter(Boolean),
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString()
      };
      
      await axios.post(`${API}/questionnaire`, dataToSend);
      toast.success('¡Cuestionario completado!');
      navigate('/precios');
    } catch (error) {
      toast.error('Error al guardar el cuestionario');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    const etapa = ETAPAS[currentStep];
    
    return (
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${etapa.color} text-white mb-4`}>
            <etapa.icon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground">{etapa.title}</h2>
          <p className="text-muted-foreground">Etapa {currentStep + 1} de {ETAPAS.length}</p>
        </div>

        {/* Paso 0: Aviso Legal y Términos */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Antes de Comenzar</h3>
                  <p className="text-muted-foreground text-sm">
                    Confirma que has leído y aceptas nuestros Términos y Condiciones y Aviso de Privacidad.
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    <strong>Aviso Importante:</strong> Este programa es solo una guía educativa y no sustituye atención médica. 
                    Si tienes alguna enfermedad o tomas medicamentos, esta información debe ser evaluada por tu médico.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <Link to="/terminos" className="text-brand-green hover:underline text-sm font-medium">
                  Términos y Condiciones
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/privacidad" className="text-brand-green hover:underline text-sm font-medium">
                  Aviso de Privacidad
                </Link>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="font-semibold text-foreground mb-4">¿Aceptas continuar?</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTermsAccepted(true)}
                    className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      termsAccepted 
                        ? 'border-brand-green bg-brand-green/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid="accept-terms-btn"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      termsAccepted ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      A
                    </div>
                    <span className="font-medium">Sí, acepto</span>
                  </button>
                  
                  <button
                    onClick={handleDecline}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all"
                    data-testid="decline-terms-btn"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                      B
                    </div>
                    <span className="font-medium">No acepto</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label>¿Cuál es tu nombre?</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                placeholder="Tu nombre completo"
                className="h-14 rounded-xl"
                data-testid="q-nombre"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Edad</Label>
                <Input
                  type="number"
                  value={formData.edad}
                  onChange={(e) => updateField('edad', e.target.value)}
                  placeholder="Años"
                  className="h-14 rounded-xl"
                  data-testid="q-edad"
                />
              </div>
              <div>
                <Label>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => updateField('fecha_nacimiento', e.target.value)}
                  className="h-14 rounded-xl"
                  data-testid="q-fecha"
                />
              </div>
            </div>
            <div>
              <Label>Sexo asignado al nacer</Label>
              <RadioGroup value={formData.sexo} onValueChange={(v) => updateField('sexo', v)} className="flex gap-4 mt-2">
                <div className="flex-1">
                  <label className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.sexo === 'Femenino' ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <RadioGroupItem value="Femenino" id="femenino" className="sr-only" />
                    <span className="font-medium">Femenino</span>
                  </label>
                </div>
                <div className="flex-1">
                  <label className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.sexo === 'Masculino' ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <RadioGroupItem value="Masculino" id="masculino" className="sr-only" />
                    <span className="font-medium">Masculino</span>
                  </label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estatura (cm)</Label>
                <Input
                  type="number"
                  value={formData.estatura}
                  onChange={(e) => updateField('estatura', e.target.value)}
                  placeholder="170"
                  className="h-14 rounded-xl"
                  data-testid="q-estatura"
                />
              </div>
              <div>
                <Label>Peso actual (kg)</Label>
                <Input
                  type="number"
                  value={formData.peso}
                  onChange={(e) => updateField('peso', e.target.value)}
                  placeholder="70"
                  className="h-14 rounded-xl"
                  data-testid="q-peso"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">¿Cuál es tu objetivo principal?</Label>
              <RadioGroup value={formData.objetivo_principal} onValueChange={(v) => updateField('objetivo_principal', v)} className="space-y-3">
                {['Control de peso', 'Bajar de peso', 'Aumentar masa muscular'].map((obj) => (
                  <label 
                    key={obj} 
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.objetivo_principal === obj ? 'border-brand-orange bg-brand-orange/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <RadioGroupItem value={obj} className="mr-3" />
                    <span className="font-medium">{obj}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="mb-3 block">¿Algún objetivo secundario?</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Mejorar digestión', 'Más energía', 'Mejores hábitos', 'Reducir inflamación'].map((obj) => (
                  <label 
                    key={obj}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.objetivos_secundarios.includes(obj) ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Checkbox
                      checked={formData.objetivos_secundarios.includes(obj)}
                      onCheckedChange={() => toggleArrayItem('objetivos_secundarios', obj)}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium">{obj}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <Label className="mb-3 block">Sobre tu rutina diaria:</Label>
            <div className="space-y-3">
              {[
                { field: 'trabajo_oficina', label: '¿Trabajas en oficina?' },
                { field: 'trabajo_fisico', label: '¿Tu trabajo es físicamente demandante?' },
                { field: 'labores_hogar', label: '¿Realizas labores del hogar?' },
                { field: 'turnos_rotativos', label: '¿Rolas turnos?' }
              ].map(({ field, label }) => (
                <label 
                  key={field}
                  className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData[field] ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Checkbox
                    checked={formData[field]}
                    onCheckedChange={(checked) => updateField(field, checked)}
                    className="mr-3"
                  />
                  <span className="font-medium">{label}</span>
                </label>
              ))}
            </div>
            <div className="pt-4">
              <Label>¿Haces ejercicio adicional?</Label>
              <Input
                value={formData.ejercicio_adicional}
                onChange={(e) => updateField('ejercicio_adicional', e.target.value)}
                placeholder="Ej: Correr, gimnasio, yoga..."
                className="h-14 rounded-xl mt-2"
                data-testid="q-ejercicio"
              />
            </div>
            <div>
              <Label>¿Cuántos días a la semana?</Label>
              <Input
                type="number"
                min="0"
                max="7"
                value={formData.dias_ejercicio}
                onChange={(e) => updateField('dias_ejercicio', e.target.value)}
                placeholder="0-7"
                className="h-14 rounded-xl mt-2"
                data-testid="q-dias-ejercicio"
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">¿Tienes algún padecimiento?</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {PADECIMIENTOS.map((pad) => (
                  <label 
                    key={pad}
                    className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${formData.padecimientos.includes(pad) ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Checkbox
                      checked={formData.padecimientos.includes(pad)}
                      onCheckedChange={() => toggleArrayItem('padecimientos', pad)}
                      className="mr-2"
                    />
                    <span>{pad}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.medicamentos_controlados ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <Checkbox
                checked={formData.medicamentos_controlados}
                onCheckedChange={(checked) => updateField('medicamentos_controlados', checked)}
                className="mr-3"
              />
              <span className="font-medium">¿Tomas medicamentos controlados?</span>
            </label>
            {(formData.padecimientos.length > 0 && !formData.padecimientos.includes('Ninguno')) || formData.medicamentos_controlados ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                <AlertCircle className="w-5 h-5 inline mr-2" />
                Si presentas alguna condición o tomas medicamentos, recuerda que esta información debe ser evaluada por tu médico. Nuestro programa es solo una guía.
              </div>
            ) : null}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <Label className="mb-3 block">¿Presentas alguno de estos síntomas?</Label>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {SINTOMAS.map((sint) => (
                <label 
                  key={sint}
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${formData.sintomas.includes(sint) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Checkbox
                    checked={formData.sintomas.includes(sint)}
                    onCheckedChange={() => toggleArrayItem('sintomas', sint)}
                    className="mr-2"
                  />
                  <span>{sint}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.fuma ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <Checkbox
                checked={formData.fuma}
                onCheckedChange={(checked) => updateField('fuma', checked)}
                className="mr-3"
              />
              <span className="font-medium">¿Fumas?</span>
            </label>
            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.consume_alcohol ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <Checkbox
                checked={formData.consume_alcohol}
                onCheckedChange={(checked) => updateField('consume_alcohol', checked)}
                className="mr-3"
              />
              <span className="font-medium">¿Consumes alcohol?</span>
            </label>
            {formData.consume_alcohol && (
              <div>
                <Label>¿Con qué frecuencia?</Label>
                <RadioGroup value={formData.frecuencia_alcohol} onValueChange={(v) => updateField('frecuencia_alcohol', v)} className="space-y-2 mt-2">
                  {['Ocasionalmente', '1-2 veces por semana', '3+ veces por semana', 'Diario'].map((freq) => (
                    <label 
                      key={freq}
                      className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.frecuencia_alcohol === freq ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <RadioGroupItem value={freq} className="mr-3" />
                      <span>{freq}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">¿Tienes alguna alergia alimentaria?</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALERGIAS.map((ale) => (
                  <label 
                    key={ale}
                    className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.alergias.includes(ale) ? 'border-brand-lime bg-brand-lime/10' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Checkbox
                      checked={formData.alergias.includes(ale)}
                      onCheckedChange={() => toggleArrayItem('alergias', ale)}
                      className="mr-2"
                    />
                    <span>{ale}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.vegetariano ? 'border-brand-green bg-brand-green/5' : 'border-gray-200 hover:border-gray-300'}`}>
              <Checkbox
                checked={formData.vegetariano}
                onCheckedChange={(checked) => updateField('vegetariano', checked)}
                className="mr-3"
              />
              <span className="font-medium">Soy vegetariano/vegano</span>
            </label>
            <div>
              <Label>Alimentos que NO te gustan (separados por coma)</Label>
              <Input
                value={formData.alimentos_no_deseados}
                onChange={(e) => updateField('alimentos_no_deseados', e.target.value)}
                placeholder="Ej: hígado, brócoli, coliflor..."
                className="h-14 rounded-xl mt-2"
                data-testid="q-alimentos-no"
              />
            </div>
            <div>
              <Label>¿Cuál es tu platillo favorito?</Label>
              <Input
                value={formData.platillo_favorito}
                onChange={(e) => updateField('platillo_favorito', e.target.value)}
                placeholder="Ej: Tacos, pasta, sushi..."
                className="h-14 rounded-xl mt-2"
                data-testid="q-platillo-fav"
              />
            </div>
          </div>
        )}

        {currentStep === 8 && (
          <div className="space-y-4">
            <div>
              <Label>¿Con qué frecuencia comes en restaurantes?</Label>
              <RadioGroup value={formData.frecuencia_restaurantes} onValueChange={(v) => updateField('frecuencia_restaurantes', v)} className="space-y-2 mt-2">
                {['Casi nunca', '1-2 veces por semana', '3-4 veces por semana', 'Casi diario'].map((freq) => (
                  <label 
                    key={freq}
                    className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.frecuencia_restaurantes === freq ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <RadioGroupItem value={freq} className="mr-3" />
                    <span>{freq}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>Ticket promedio por comida fuera ($)</Label>
              <Input
                type="number"
                value={formData.ticket_promedio}
                onChange={(e) => updateField('ticket_promedio', e.target.value)}
                placeholder="150"
                className="h-14 rounded-xl mt-2"
                data-testid="q-ticket"
              />
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {ETAPAS.map((etapa, index) => (
              <div 
                key={etapa.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  index < currentStep ? 'bg-brand-green text-white' : 
                  index === currentStep ? 'bg-brand-orange text-white' : 
                  'bg-gray-200 text-gray-500'
                }`}
              >
                {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2 bg-gray-200" />
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="rounded-full px-6"
              data-testid="btn-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            {currentStep < ETAPAS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={currentStep === 0 && !termsAccepted}
                className="bg-brand-orange hover:bg-brand-orange/90 rounded-full px-6"
                data-testid="btn-next"
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-brand-green hover:bg-brand-green/90 rounded-full px-8"
                data-testid="btn-submit"
              >
                {loading ? 'Guardando...' : 'Finalizar'}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
