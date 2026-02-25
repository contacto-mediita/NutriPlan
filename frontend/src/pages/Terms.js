import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const Terms = () => {
  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 py-12" data-testid="terms-page">
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
                <FileText className="w-7 h-7 text-brand-green" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">Términos y Condiciones</h1>
                <p className="text-muted-foreground">Última actualización: Febrero 2026</p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-muted-foreground">
              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar NutriPlan ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones. 
                Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al Servicio.
              </p>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">2. Naturaleza del Servicio</h2>
              <p>
                <strong className="text-foreground">NutriPlan es un programa de orientación nutricional y NO constituye un servicio médico, 
                diagnóstico o tratamiento.</strong> Los planes alimenticios y recomendaciones proporcionadas son únicamente 
                de carácter informativo y educativo.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 my-4">
                <p className="text-yellow-800 m-0">
                  <strong>⚠️ Aviso Importante:</strong> Este programa es solo una guía educativa y no sustituye la atención médica profesional. 
                  Si usted padece alguna enfermedad, condición médica o toma medicamentos, DEBE consultar con su médico antes de 
                  iniciar cualquier plan alimenticio o programa de ejercicios.
                </p>
              </div>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">3. Uso del Servicio</h2>
              <p>El usuario se compromete a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proporcionar información veraz y actualizada en el cuestionario</li>
                <li>Utilizar el Servicio únicamente para fines personales y no comerciales</li>
                <li>No compartir su cuenta con terceros</li>
                <li>Consultar con un profesional de la salud antes de realizar cambios significativos en su alimentación</li>
              </ul>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">4. Limitación de Responsabilidad</h2>
              <p>
                NutriPlan y sus creadores <strong className="text-foreground">no se hacen responsables</strong> por:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Resultados individuales que puedan variar de persona a persona</li>
                <li>Efectos adversos derivados del incumplimiento de las recomendaciones médicas</li>
                <li>Decisiones tomadas basándose únicamente en la información proporcionada por el Servicio</li>
                <li>Condiciones de salud preexistentes no declaradas por el usuario</li>
              </ul>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">5. Propiedad Intelectual</h2>
              <p>
                Todo el contenido del Servicio, incluyendo pero no limitado a planes alimenticios, recetas, 
                guías de ejercicios y diseño, es propiedad exclusiva de NutriPlan y está protegido por las 
                leyes de propiedad intelectual.
              </p>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">6. Pagos y Suscripciones</h2>
              <p>
                Los planes de suscripción tienen la duración especificada al momento de la compra. 
                Los pagos son procesados de forma segura a través de Stripe. No se realizan reembolsos 
                una vez iniciado el período de suscripción, excepto en casos excepcionales evaluados 
                individualmente.
              </p>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">7. Modificaciones</h2>
              <p>
                NutriPlan se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. 
                Los usuarios serán notificados de cambios significativos a través del correo electrónico registrado.
              </p>

              <h2 className="text-xl font-heading font-bold text-foreground mt-8 mb-4">8. Contacto</h2>
              <p>
                Para cualquier duda o aclaración sobre estos Términos y Condiciones, puede contactarnos 
                a través de nuestros canales oficiales de atención al cliente.
              </p>

              <div className="bg-brand-green/5 rounded-xl p-6 mt-8">
                <p className="text-foreground font-medium m-0">
                  Al utilizar NutriPlan, usted reconoce haber leído, entendido y aceptado estos Términos y Condiciones 
                  en su totalidad.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
