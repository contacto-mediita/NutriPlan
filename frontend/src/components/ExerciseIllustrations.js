// Exercise illustrations as simple SVG icons
const ExerciseIllustrations = {
  // Upper Body
  lagartijas: (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="55" rx="45" ry="3" fill="#E5E7EB" />
      <path d="M20 35 L35 25 L65 25 L80 35" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
      <circle cx="35" cy="20" r="8" fill="#FFB74D" />
      <path d="M35 28 L35 40 M35 32 L25 38 M35 32 L45 38" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 40 L28 52 M35 40 L42 52" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  press: (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <rect x="10" y="30" width="80" height="4" rx="2" fill="#9E9E9E" />
      <circle cx="15" cy="32" r="8" fill="#757575" />
      <circle cx="85" cy="32" r="8" fill="#757575" />
      <ellipse cx="50" cy="42" rx="20" ry="8" fill="#E5E7EB" />
      <circle cx="50" cy="25" r="8" fill="#FFB74D" />
      <path d="M50 33 L50 45 M30 28 L50 28 L70 28" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  sentadillas: (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="55" rx="25" ry="3" fill="#E5E7EB" />
      <circle cx="50" cy="12" r="8" fill="#FFB74D" />
      <path d="M50 20 L50 32 M50 32 L40 50 M50 32 L60 50" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 50 L38 55 M60 50 L62 55" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M45 25 L35 28 M55 25 L65 28" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  plancha: (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="55" rx="45" ry="3" fill="#E5E7EB" />
      <path d="M15 45 L85 45" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="40" r="6" fill="#FFB74D" />
      <path d="M26 42 L80 42" stroke="#4CAF50" strokeWidth="2" />
      <path d="M15 45 L15 52 M85 45 L85 52" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  fondos: (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <rect x="20" y="25" width="60" height="5" rx="2" fill="#9E9E9E" />
      <circle cx="50" cy="15" r="8" fill="#FFB74D" />
      <path d="M50 23 L50 35 M50 35 L45 50 M50 35 L55 50" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M42 28 L35 25 M58 28 L65 25" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  curl: (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="55" rx="15" ry="3" fill="#E5E7EB" />
      <circle cx="50" cy="12" r="8" fill="#FFB74D" />
      <path d="M50 20 L50 45 M50 45 L45 55 M50 45 L55 55" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M45 25 L40 35 L45 38" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <circle cx="43" cy="40" r="4" fill="#757575" />
    </svg>
  ),
  remo: (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="55" rx="25" ry="3" fill="#E5E7EB" />
      <circle cx="50" cy="20" r="8" fill="#FFB74D" />
      <path d="M50 28 L50 40 L45 52 M50 40 L55 52" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M42 32 L30 38 M58 32 L70 38" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <rect x="25" y="36" width="8" height="3" rx="1" fill="#757575" />
      <rect x="67" y="36" width="8" height="3" rx="1" fill="#757575" />
    </svg>
  ),
  cardio: (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="55" rx="30" ry="3" fill="#E5E7EB" />
      <circle cx="40" cy="15" r="7" fill="#FFB74D" />
      <path d="M40 22 L40 35 M40 35 L30 52 M40 35 L50 52" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M35 26 L25 22 M45 26 L55 22" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 25 Q70 20 80 30 Q70 40 60 35 Q50 40 40 30 Q50 20 60 25" fill="#FF5252" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
      <ellipse cx="50" cy="55" rx="20" ry="3" fill="#E5E7EB" />
      <circle cx="50" cy="15" r="10" fill="#FFB74D" />
      <path d="M50 25 L50 40 M50 40 L40 55 M50 40 L60 55" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
      <path d="M40 30 L30 35 M60 30 L70 35" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
};

export const getExerciseIllustration = (exerciseName) => {
  const name = exerciseName.toLowerCase();
  
  if (name.includes('lagartija') || name.includes('flexion') || name.includes('pushup')) {
    return ExerciseIllustrations.lagartijas;
  }
  if (name.includes('press') || name.includes('banco') || name.includes('banca')) {
    return ExerciseIllustrations.press;
  }
  if (name.includes('sentadilla') || name.includes('squat')) {
    return ExerciseIllustrations.sentadillas;
  }
  if (name.includes('plancha') || name.includes('plank')) {
    return ExerciseIllustrations.plancha;
  }
  if (name.includes('fondo') || name.includes('dip')) {
    return ExerciseIllustrations.fondos;
  }
  if (name.includes('curl') || name.includes('bicep')) {
    return ExerciseIllustrations.curl;
  }
  if (name.includes('remo') || name.includes('row') || name.includes('jalon') || name.includes('jalón')) {
    return ExerciseIllustrations.remo;
  }
  if (name.includes('cardio') || name.includes('correr') || name.includes('trotar') || name.includes('caminar')) {
    return ExerciseIllustrations.cardio;
  }
  
  return ExerciseIllustrations.default;
};

export default ExerciseIllustrations;
