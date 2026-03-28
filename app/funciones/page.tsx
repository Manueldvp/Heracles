import { BellRing, Dumbbell, Salad } from 'lucide-react'
import MarketingPageShell from '@/components/marketing/marketing-page-shell'

export default function FuncionesPage() {
  return (
    <MarketingPageShell
      eyebrow="Funciones"
      title="Una plataforma para gestionar clientes, rutinas, nutrición y seguimiento sin caos"
      description="Treinex reúne las funciones que un coach necesita para operar con claridad: invitaciones, entrega de planes, monitoreo y contexto accionable."
      heroPoints={['Invita clientes y ordénalos por estado', 'Entrega rutinas y planes con estructura', 'Activa recordatorios y seguimiento']}
      sections={[
        { title: 'Rutinas', copy: 'Planifica semanas, asigna días y revisa progreso de cargas.', icon: Dumbbell },
        { title: 'Nutrición', copy: 'Entrega planes visuales, claros y adaptados a cada cliente.', icon: Salad },
        { title: 'Alertas', copy: 'Detecta inactividad, planes vencidos y tareas pendientes.', icon: BellRing },
      ]}
      visuals={[
        { title: 'Vista por cliente', copy: 'Notas, progreso, check-ins y material entregado en una misma ruta.', image: '/marketing/client-detail.svg' },
        { title: 'Seguimiento continuo', copy: 'El producto te ayuda a no perder señales relevantes durante la semana.', image: '/marketing/followup.svg' },
      ]}
    />
  )
}
