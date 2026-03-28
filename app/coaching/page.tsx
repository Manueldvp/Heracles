import { BarChart3, ClipboardCheck, Sparkles } from 'lucide-react'
import MarketingPageShell from '@/components/marketing/marketing-page-shell'

export default function CoachingPage() {
  return (
    <MarketingPageShell
      eyebrow="Coaching"
      title="Coaching online con estructura real para entrenadores que escalan"
      description="Treinex convierte el seguimiento en un sistema operativo: clientes, rutinas, nutrición, check-ins y señales de adherencia en una sola experiencia clara."
      heroPoints={['Seguimiento semanal centralizado', 'Rutinas y nutrición listas para entregar', 'Alertas para no perder contexto']}
      sections={[
        { title: 'Operación guiada', copy: 'Cada cliente tiene un estado claro, tareas visibles y próximos pasos definidos.', icon: ClipboardCheck },
        { title: 'Seguimiento útil', copy: 'Notas, cargas, check-ins y evolución visual se conectan sin ruido.', icon: BarChart3 },
        { title: 'Entrega premium', copy: 'La experiencia se siente consistente tanto para entrenador como para cliente.', icon: Sparkles },
      ]}
      visuals={[
        { title: 'Vista operativa', copy: 'Panel para decidir rápido qué revisar, qué enviar y a quién priorizar.', image: '/marketing/coach-dashboard.svg' },
        { title: 'Experiencia cliente', copy: 'Rutina, nutrición y progreso accesibles desde una interfaz clara y móvil.', image: '/marketing/client-flow.svg' },
      ]}
    />
  )
}
