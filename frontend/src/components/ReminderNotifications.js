import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Droplets, Moon, Utensils, X, Settings, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

const REMINDER_TYPES = [
  {
    id: 'water',
    name: 'Beber agua',
    icon: Droplets,
    color: 'bg-blue-100 text-blue-600',
    message: '¡Hora de hidratarte! Bebe un vaso de agua.',
    interval: 60 // minutos
  },
  {
    id: 'breakfast',
    name: 'Desayuno',
    icon: Utensils,
    color: 'bg-yellow-100 text-yellow-600',
    message: '¡Buenos días! Es hora de tu desayuno nutritivo.',
    time: '08:00'
  },
  {
    id: 'lunch',
    name: 'Comida',
    icon: Utensils,
    color: 'bg-green-100 text-green-600',
    message: '¡Hora de comer! Disfruta tu comida del plan.',
    time: '14:00'
  },
  {
    id: 'snack',
    name: 'Snack',
    icon: Utensils,
    color: 'bg-purple-100 text-purple-600',
    message: '¡Hora del snack! Un pequeño bocado saludable.',
    time: '17:00'
  },
  {
    id: 'dinner',
    name: 'Cena',
    icon: Utensils,
    color: 'bg-orange-100 text-orange-600',
    message: '¡Hora de cenar! Recuerda comer ligero.',
    time: '20:00'
  },
  {
    id: 'sleep',
    name: 'Ir a dormir',
    icon: Moon,
    color: 'bg-indigo-100 text-indigo-600',
    message: '¡Hora de descansar! Prepárate para dormir bien.',
    time: '22:00'
  }
];

const ReminderNotifications = ({ questionnaire }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('nutriplan_reminders');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      enabled: true,
      water: true,
      breakfast: true,
      lunch: true,
      snack: true,
      dinner: true,
      sleep: true
    };
  });
  const [lastWaterReminder, setLastWaterReminder] = useState(Date.now());
  const [pendingReminders, setPendingReminders] = useState([]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('nutriplan_reminders', JSON.stringify(settings));
  }, [settings]);

  // Check for time-based reminders
  useEffect(() => {
    if (!settings.enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      REMINDER_TYPES.forEach(reminder => {
        if (!settings[reminder.id]) return;
        
        // Time-based reminders
        if (reminder.time) {
          // Check if it's within 1 minute of the scheduled time
          const [remHour, remMin] = reminder.time.split(':').map(Number);
          const [curHour, curMin] = currentTime.split(':').map(Number);
          
          if (curHour === remHour && curMin === remMin) {
            // Check if we already showed this today
            const lastShown = localStorage.getItem(`reminder_${reminder.id}_last`);
            const today = now.toDateString();
            
            if (lastShown !== today) {
              showReminder(reminder);
              localStorage.setItem(`reminder_${reminder.id}_last`, today);
            }
          }
        }
        
        // Interval-based reminders (water)
        if (reminder.interval && reminder.id === 'water') {
          const elapsed = (Date.now() - lastWaterReminder) / (1000 * 60);
          if (elapsed >= reminder.interval) {
            showReminder(reminder);
            setLastWaterReminder(Date.now());
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately on mount

    return () => clearInterval(interval);
  }, [settings, lastWaterReminder]);

  const showReminder = (reminder) => {
    const Icon = reminder.icon;
    
    toast(reminder.message, {
      icon: <Icon className="w-5 h-5" />,
      duration: 8000,
      action: {
        label: 'Listo',
        onClick: () => {}
      }
    });

    // Add to pending reminders panel
    setPendingReminders(prev => {
      const exists = prev.find(r => r.id === reminder.id);
      if (exists) return prev;
      return [...prev.slice(-4), { ...reminder, timestamp: Date.now() }];
    });
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const dismissReminder = (id) => {
    setPendingReminders(prev => prev.filter(r => r.id !== id));
  };

  const triggerTestReminder = () => {
    const waterReminder = REMINDER_TYPES.find(r => r.id === 'water');
    if (waterReminder) {
      showReminder(waterReminder);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full"
          data-testid="reminder-bell-btn"
        >
          <Bell className="w-5 h-5" />
          {pendingReminders.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-orange text-white text-xs rounded-full flex items-center justify-center">
              {pendingReminders.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-green" />
              Recordatorios
            </h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="reminders-enabled" className="text-xs text-muted-foreground">
                {settings.enabled ? 'Activo' : 'Pausado'}
              </Label>
              <Switch
                id="reminders-enabled"
                checked={settings.enabled}
                onCheckedChange={() => toggleSetting('enabled')}
                data-testid="reminders-master-switch"
              />
            </div>
          </div>
        </div>

        {/* Pending Reminders */}
        {pendingReminders.length > 0 && (
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs text-muted-foreground mb-2">Recordatorios recientes</p>
            <div className="space-y-2">
              {pendingReminders.map((reminder) => {
                const Icon = reminder.icon;
                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-2 p-2 rounded-lg ${reminder.color.split(' ')[0]}`}
                  >
                    <Icon className={`w-4 h-4 ${reminder.color.split(' ')[1]}`} />
                    <span className="text-xs flex-1">{reminder.name}</span>
                    <button
                      onClick={() => dismissReminder(reminder.id)}
                      className="p-1 hover:bg-white/50 rounded"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
            <Settings className="w-3 h-3" />
            Configurar recordatorios
          </p>
          <div className="space-y-2">
            {REMINDER_TYPES.map((reminder) => {
              const Icon = reminder.icon;
              return (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${reminder.color.split(' ')[0]}`}>
                      <Icon className={`w-3.5 h-3.5 ${reminder.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <span className="text-sm font-medium">{reminder.name}</span>
                      <span className="text-xs text-muted-foreground block">
                        {reminder.time || `Cada ${reminder.interval} min`}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={settings[reminder.id]}
                    onCheckedChange={() => toggleSetting(reminder.id)}
                    disabled={!settings.enabled}
                    data-testid={`reminder-switch-${reminder.id}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Button */}
        <div className="p-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={triggerTestReminder}
            data-testid="test-reminder-btn"
          >
            <Bell className="w-3 h-3 mr-2" />
            Probar recordatorio
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReminderNotifications;
