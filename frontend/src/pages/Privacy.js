import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Lock, Eye, Database, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12" data-testid="privacy-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link to="/cuestionario">
            <Button variant="ghost" className="mb-6 rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-brand-green" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">Aviso de Privacidad</h1>
                <p className="text-muted-foreground">Última actualización: Febrero 2026</p>
              </div>
            </div>

            {/* Key Points Summary */}
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              <div className="bg-brand-green/5 rounded-2xl p-5 text-center">
                <Lock className="w-8 h-8 text-brand-green mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">Datos Protegidos</h3>
                <p className="text-sm text-muted-foreground">Tu información está segura con nosotros</p>
              </div>
              <div className="bg-brand-green/5 rounded-2xl p-5 text-center">
                <Eye className="w-8 h-8 text-brand-green mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">Sin Fines Comerciales</h3>
                <p className="text-sm text-muted-foreground">No usamos tus datos para publicidad</p>
              </div>
              <div className="bg-brand-green/5 rounded-2xl p-5 text-center">
                <UserCheck className="w-8 h-8 text-brand-green mx-auto mb-3" />
                <h3 className="font-bold text-foreground mb-1">No Compartimos</h3>
                <p className="text-sm text-muted-foreground">Tus datos nunca se venden a terceros</p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-muted-foreground">
              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">1. Responsable del Tratamiento</h2>
              <p>
                NutriPlan es el responsable del tratamiento de los datos personales que usted nos proporciona 
                a través de nuestra plataforma.
              </p>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">2. Datos Personales que Recopilamos</h2>
              <p>Para brindarle nuestro servicio, recopilamos los siguientes datos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Datos de identificación:</strong> Nombre, correo electrónico</li>
                <li><strong className="text-foreground">Datos de salud:</strong> Peso, estatura, edad, sexo, padecimientos, síntomas</li>
                <li><strong className="text-foreground">Datos de hábitos:</strong> Actividad física, alimentación, consumo de alcohol/tabaco</li>
                <li><strong className="text-foreground">Datos de preferencias:</strong> Alergias, restricciones alimenticias</li>
              </ul>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">3. Finalidad del Tratamiento</h2>
              <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-6 my-4">
                <p className="text-foreground font-medium m-0">
                  Sus datos personales son utilizados <strong>ÚNICAMENTE</strong> para:
                </p>
                <ul className="list-disc pl-6 mt-3 mb-0 text-foreground">
                  <li>Generar su plan alimenticio personalizado</li>
                  <li>Crear recomendaciones de ejercicios adaptadas a su perfil</li>
                  <li>Calcular sus requerimientos nutricionales (calorías, macronutrientes)</li>
                  <li>Dar seguimiento a su progreso</li>
                  <li>Enviar comunicaciones relacionadas con su suscripción</li>
                </ul>
              </div>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">4. Compromiso de No Uso Comercial</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 my-4">
                <p className="text-yellow-800 m-0">
                  <strong>🔒 Nos comprometemos a que sus datos personales:</strong>
                </p>
                <ul className="list-disc pl-6 mt-3 mb-0 text-yellow-800">
                  <li><strong>NO</strong> serán utilizados para fines comerciales ni publicitarios</li>
                  <li><strong>NO</strong> serán vendidos a terceras partes bajo ninguna circunstancia</li>
                  <li><strong>NO</strong> serán compartidos con empresas de marketing</li>
                  <li><strong>NO</strong> serán utilizados para crear perfiles publicitarios</li>
                </ul>
              </div>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">5. Compartición de Datos</h2>
              <p>
                <strong className="text-foreground">No compartimos sus datos personales con terceros</strong>, excepto en los 
                siguientes casos estrictamente necesarios:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Procesador de pagos (Stripe):</strong> Solo los datos necesarios para procesar su pago de forma segura</li>
                <li><strong className="text-foreground">Requerimiento legal:</strong> Cuando exista una orden judicial o requerimiento de autoridad competente</li>
              </ul>
              <p>
                En ningún caso vendemos, alquilamos o comercializamos sus datos personales.
              </p>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">6. Seguridad de los Datos</h2>
              <p>Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Contraseñas almacenadas con hash seguro (bcrypt)</li>
                <li>Acceso restringido a bases de datos</li>
                <li>Monitoreo continuo de seguridad</li>
              </ul>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">7. Sus Derechos</h2>
              <p>Usted tiene derecho a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Acceso:</strong> Conocer qué datos tenemos sobre usted</li>
                <li><strong className="text-foreground">Rectificación:</strong> Corregir datos inexactos</li>
                <li><strong className="text-foreground">Cancelación:</strong> Solicitar la eliminación de sus datos</li>
                <li><strong className="text-foreground">Oposición:</strong> Oponerse al tratamiento de sus datos</li>
              </ul>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">8. Retención de Datos</h2>
              <p>
                Sus datos personales serán conservados mientras mantenga una cuenta activa en nuestro servicio. 
                Una vez cancelada su cuenta, sus datos serán eliminados en un plazo máximo de 30 días, 
                excepto aquellos que debamos conservar por obligación legal.
              </p>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">9. Contacto</h2>
              <p>
                Para ejercer sus derechos o resolver cualquier duda sobre el tratamiento de sus datos, 
                puede contactarnos a través de nuestros canales oficiales.
              </p>

              <div className="bg-brand-green/5 rounded-xl p-6 mt-8">
                <p className="text-foreground font-medium m-0">
                  Al utilizar NutriPlan, usted consiente el tratamiento de sus datos personales conforme 
                  a lo establecido en este Aviso de Privacidad.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;
