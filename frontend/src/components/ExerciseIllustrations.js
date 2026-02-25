// Exercise infographics with visual instructions
import { motion } from 'framer-motion';

// Detailed exercise illustrations with step-by-step visual guides
const ExerciseInfographics = {
  lagartijas: {
    name: "Lagartijas",
    muscle: "Pecho, Tríceps, Core",
    illustration: (
      <svg viewBox="0 0 200 100" fill="none" className="w-full h-full">
        {/* Ground */}
        <rect x="0" y="85" width="200" height="15" fill="#E8F5E9" rx="2" />
        
        {/* Start Position (left) */}
        <g transform="translate(10, 0)">
          <text x="25" y="15" fontSize="8" fill="#666" textAnchor="middle">1. Inicio</text>
          {/* Body in plank */}
          <ellipse cx="25" cy="55" rx="8" ry="8" fill="#FFB74D" />
          <path d="M33 55 L70 60" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 60 L75 80" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 55 L25 75 L25 82" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
        </g>
        
        {/* Down Position (middle) */}
        <g transform="translate(75, 0)">
          <text x="25" y="15" fontSize="8" fill="#666" textAnchor="middle">2. Baja</text>
          <ellipse cx="25" cy="68" rx="8" ry="8" fill="#FFB74D" />
          <path d="M33 70 L70 72" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 72 L75 82" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 68 L28 78 L25 82" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          {/* Arrow down */}
          <path d="M25 30 L25 45 M20 40 L25 45 L30 40" stroke="#FF5722" strokeWidth="2" fill="none" />
        </g>
        
        {/* Up Position (right) */}
        <g transform="translate(140, 0)">
          <text x="25" y="15" fontSize="8" fill="#666" textAnchor="middle">3. Sube</text>
          <ellipse cx="25" cy="55" rx="8" ry="8" fill="#FFB74D" />
          <path d="M33 55 L70 60" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 60 L75 80" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M33 55 L25 75 L25 82" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          {/* Arrow up */}
          <path d="M25 45 L25 30 M20 35 L25 30 L30 35" stroke="#4CAF50" strokeWidth="2" fill="none" />
        </g>
      </svg>
    ),
    tips: ["Mantén el core apretado", "Baja hasta que el pecho casi toque el suelo", "Exhala al subir"]
  },
  
  sentadillas: {
    name: "Sentadillas",
    muscle: "Cuádriceps, Glúteos, Core",
    illustration: (
      <svg viewBox="0 0 200 100" fill="none" className="w-full h-full">
        <rect x="0" y="90" width="200" height="10" fill="#E8F5E9" rx="2" />
        
        {/* Standing (left) */}
        <g transform="translate(20, 0)">
          <text x="20" y="12" fontSize="8" fill="#666" textAnchor="middle">1. Parado</text>
          <circle cx="20" cy="22" r="8" fill="#FFB74D" />
          <path d="M20 30 L20 55" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 55 L20 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 35 L5 40 M25 35 L35 40" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
        </g>
        
        {/* Squat (middle) */}
        <g transform="translate(85, 0)">
          <text x="20" y="12" fontSize="8" fill="#666" textAnchor="middle">2. Baja</text>
          <circle cx="20" cy="35" r="8" fill="#FFB74D" />
          <path d="M20 43 L20 55" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 55 L10 70 L10 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M20 55 L30 70 L30 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 48 L0 45 M25 48 L40 45" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
          {/* 90 degree indicator */}
          <path d="M10 70 L18 70 L18 62" stroke="#FF5722" strokeWidth="1" fill="none" />
          <text x="22" y="68" fontSize="6" fill="#FF5722">90°</text>
        </g>
        
        {/* Standing again (right) */}
        <g transform="translate(155, 0)">
          <text x="20" y="12" fontSize="8" fill="#666" textAnchor="middle">3. Sube</text>
          <circle cx="20" cy="22" r="8" fill="#FFB74D" />
          <path d="M20 30 L20 55" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 55 L20 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 35 L5 40 M25 35 L35 40" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
          <path d="M20 50 L20 35 M15 40 L20 35 L25 40" stroke="#4CAF50" strokeWidth="2" fill="none" />
        </g>
      </svg>
    ),
    tips: ["Rodillas alineadas con los pies", "Baja hasta que los muslos estén paralelos", "Espalda recta"]
  },
  
  plancha: {
    name: "Plancha",
    muscle: "Core, Hombros, Espalda",
    illustration: (
      <svg viewBox="0 0 200 80" fill="none" className="w-full h-full">
        <rect x="0" y="70" width="200" height="10" fill="#E8F5E9" rx="2" />
        
        {/* Main plank position */}
        <g transform="translate(30, 10)">
          {/* Body */}
          <ellipse cx="20" cy="35" rx="10" ry="10" fill="#FFB74D" />
          <path d="M30 35 L120 40" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" />
          
          {/* Arms */}
          <path d="M30 38 L20 55" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          
          {/* Legs */}
          <path d="M120 40 L130 55" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          
          {/* Alignment line */}
          <path d="M20 30 L130 35" stroke="#FF5722" strokeWidth="1" strokeDasharray="4 2" />
          <text x="75" y="25" fontSize="7" fill="#FF5722" textAnchor="middle">Mantén línea recta</text>
          
          {/* Core indicator */}
          <ellipse cx="70" cy="38" rx="15" ry="8" fill="none" stroke="#2196F3" strokeWidth="1" strokeDasharray="2 2" />
          <text x="70" y="52" fontSize="6" fill="#2196F3" textAnchor="middle">Core activado</text>
        </g>
        
        {/* Timer */}
        <g transform="translate(160, 25)">
          <circle cx="15" cy="15" r="12" fill="none" stroke="#4CAF50" strokeWidth="2" />
          <path d="M15 8 L15 15 L20 15" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
          <text x="15" y="38" fontSize="6" fill="#666" textAnchor="middle">30-60s</text>
        </g>
      </svg>
    ),
    tips: ["Activa el core todo el tiempo", "No dejes caer la cadera", "Respira de forma controlada"]
  },
  
  fondos: {
    name: "Fondos en Silla",
    muscle: "Tríceps, Hombros",
    illustration: (
      <svg viewBox="0 0 200 100" fill="none" className="w-full h-full">
        <rect x="0" y="90" width="200" height="10" fill="#E8F5E9" rx="2" />
        
        {/* Chair/bench */}
        <rect x="25" y="45" width="50" height="8" fill="#9E9E9E" rx="2" />
        <rect x="30" y="53" width="5" height="37" fill="#757575" />
        <rect x="65" y="53" width="5" height="37" fill="#757575" />
        
        {/* Start position */}
        <g transform="translate(0, 0)">
          <text x="50" y="12" fontSize="8" fill="#666" textAnchor="middle">1. Arriba</text>
          <circle cx="50" cy="28" r="7" fill="#FFB74D" />
          <path d="M50 35 L50 50" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M45 38 L30 48 M55 38 L70 48" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
          <path d="M50 50 L40 75 L40 88 M50 50 L60 75 L60 88" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
        </g>
        
        {/* Down position */}
        <g transform="translate(100, 0)">
          <text x="50" y="12" fontSize="8" fill="#666" textAnchor="middle">2. Baja 90°</text>
          <rect x="25" y="55" width="50" height="8" fill="#9E9E9E" rx="2" />
          <circle cx="50" cy="42" r="7" fill="#FFB74D" />
          <path d="M50 49 L50 60" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M45 52 L30 60 M55 52 L70 60" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
          <path d="M50 60 L40 75 L40 88 M50 60 L60 75 L60 88" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
          {/* 90 degree */}
          <path d="M30 60 L38 60 L38 52" stroke="#FF5722" strokeWidth="1" fill="none" />
        </g>
      </svg>
    ),
    tips: ["Codos hacia atrás, no hacia afuera", "Baja hasta 90 grados", "Empuja con los tríceps"]
  },
  
  curl: {
    name: "Curl de Bíceps",
    muscle: "Bíceps",
    illustration: (
      <svg viewBox="0 0 200 100" fill="none" className="w-full h-full">
        <rect x="0" y="90" width="200" height="10" fill="#E8F5E9" rx="2" />
        
        {/* Down position */}
        <g transform="translate(30, 0)">
          <text x="20" y="12" fontSize="8" fill="#666" textAnchor="middle">1. Abajo</text>
          <circle cx="20" cy="25" r="8" fill="#FFB74D" />
          <path d="M20 33 L20 55" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 55 L20 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          {/* Arms down with weight */}
          <path d="M15 38 L15 70" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <circle cx="15" cy="73" r="5" fill="#757575" />
          <path d="M25 38 L25 70" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <circle cx="25" cy="73" r="5" fill="#757575" />
        </g>
        
        {/* Up position */}
        <g transform="translate(120, 0)">
          <text x="20" y="12" fontSize="8" fill="#666" textAnchor="middle">2. Arriba</text>
          <circle cx="20" cy="25" r="8" fill="#FFB74D" />
          <path d="M20 33 L20 55" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 55 L20 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          {/* Arms up with weight */}
          <path d="M15 38 L8 42 L10 35" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <circle cx="10" cy="32" r="5" fill="#757575" />
          <path d="M25 38 L32 42 L30 35" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <circle cx="30" cy="32" r="5" fill="#757575" />
          {/* Bicep highlight */}
          <ellipse cx="8" cy="40" rx="4" ry="6" fill="none" stroke="#FF5722" strokeWidth="1" />
        </g>
        
        {/* Arrow */}
        <path d="M70 50 L100 50 M95 45 L100 50 L95 55" stroke="#2196F3" strokeWidth="2" />
      </svg>
    ),
    tips: ["Codos pegados al cuerpo", "Contrae en la parte alta", "Baja controlado"]
  },
  
  remo: {
    name: "Remo",
    muscle: "Espalda, Bíceps",
    illustration: (
      <svg viewBox="0 0 200 100" fill="none" className="w-full h-full">
        <rect x="0" y="90" width="200" height="10" fill="#E8F5E9" rx="2" />
        
        {/* Start position */}
        <g transform="translate(20, 0)">
          <text x="30" y="12" fontSize="8" fill="#666" textAnchor="middle">1. Estira</text>
          <circle cx="30" cy="35" r="8" fill="#FFB74D" />
          <path d="M30 43 L50 60" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 60 L45 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 60 L55 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          {/* Arms extended */}
          <path d="M30 40 L10 55" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <rect x="3" y="52" width="10" height="6" fill="#757575" rx="1" />
        </g>
        
        {/* Pull position */}
        <g transform="translate(110, 0)">
          <text x="30" y="12" fontSize="8" fill="#666" textAnchor="middle">2. Jala</text>
          <circle cx="30" cy="35" r="8" fill="#FFB74D" />
          <path d="M30 43 L50 60" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 60 L45 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 60 L55 88" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          {/* Arms pulled back */}
          <path d="M30 40 L35 50" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
          <rect x="32" y="47" width="10" height="6" fill="#757575" rx="1" />
          {/* Back squeeze indicator */}
          <path d="M38 35 L45 35" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
          <text x="55" y="37" fontSize="6" fill="#FF5722">Aprieta</text>
        </g>
      </svg>
    ),
    tips: ["Espalda recta en 45°", "Jala hacia el ombligo", "Aprieta los omóplatos"]
  },
  
  default: {
    name: "Ejercicio",
    muscle: "General",
    illustration: (
      <svg viewBox="0 0 200 100" fill="none" className="w-full h-full">
        <rect x="0" y="90" width="200" height="10" fill="#E8F5E9" rx="2" />
        <circle cx="100" cy="25" r="12" fill="#FFB74D" />
        <path d="M100 37 L100 60" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" />
        <path d="M100 60 L85 88 M100 60 L115 88" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
        <path d="M90 45 L70 55 M110 45 L130 55" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
        <text x="100" y="75" fontSize="8" fill="#666" textAnchor="middle">Ejercicio básico</text>
      </svg>
    ),
    tips: ["Mantén buena postura", "Respira correctamente", "No sacrifiques técnica"]
  }
};

// Get infographic for an exercise
export const getExerciseInfographic = (exerciseName) => {
  const name = exerciseName.toLowerCase();
  
  if (name.includes('lagartija') || name.includes('flexion') || name.includes('pushup') || name.includes('push-up')) {
    return ExerciseInfographics.lagartijas;
  }
  if (name.includes('sentadilla') || name.includes('squat')) {
    return ExerciseInfographics.sentadillas;
  }
  if (name.includes('plancha') || name.includes('plank')) {
    return ExerciseInfographics.plancha;
  }
  if (name.includes('fondo') || name.includes('dip')) {
    return ExerciseInfographics.fondos;
  }
  if (name.includes('curl') || name.includes('bicep') || name.includes('bícep')) {
    return ExerciseInfographics.curl;
  }
  if (name.includes('remo') || name.includes('row') || name.includes('jalon') || name.includes('jalón')) {
    return ExerciseInfographics.remo;
  }
  
  return ExerciseInfographics.default;
};

// Simple illustration component for list view
export const getExerciseIllustration = (exerciseName) => {
  const infographic = getExerciseInfographic(exerciseName);
  return infographic.illustration;
};

// Exercise Card Component with full infographic
export const ExerciseInfoCard = ({ exerciseName, onClose }) => {
  const info = getExerciseInfographic(exerciseName);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">{info.name}</h3>
          <p className="text-sm text-muted-foreground">{info.muscle}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        {info.illustration}
      </div>
      
      <div>
        <h4 className="text-sm font-bold text-foreground mb-2">💡 Tips:</h4>
        <ul className="space-y-1">
          {info.tips.map((tip, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-green-500">✓</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default ExerciseInfographics;
