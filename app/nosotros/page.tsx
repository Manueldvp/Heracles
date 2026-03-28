import { HeartHandshake, LayoutDashboard, Users } from 'lucide-react'
import MarketingPageShell from '@/components/marketing/marketing-page-shell'

export default function NosotrosPage() {
  return (
    <MarketingPageShell
      eyebrow="Nosotros"
      title="Construimos software para entrenadores que quieren trabajar mejor y crecer con criterio"
      description="Treinex nace para resolver una tensión común: ofrecer un servicio personalizado sin perder orden operativo, seguimiento y percepción premium."
      heroPoints={['Producto centrado en ejecución', 'Diseño claro para uso diario', 'Pensado para relaciones trainer-client']}
      sections={[
        { title: 'Menos fricción', copy: 'Reducimos tareas repetitivas y zonas grises en la comunicación.', icon: LayoutDashboard },
        { title: 'Más confianza', copy: 'Una experiencia visual consistente mejora la percepción del servicio.', icon: HeartHandshake },
        { title: 'Relación más fuerte', copy: 'Entrenador y cliente comparten mejor contexto y mejores decisiones.', icon: Users },
      ]}
      visuals={[
        { title: 'Diseño de producto', copy: 'Cada pantalla busca claridad, jerarquía y continuidad entre vistas.', image: '/marketing/product-design.svg' },
        { title: 'Trabajo colaborativo', copy: 'Todo el sistema está orientado a que entrenador y cliente se entiendan mejor.', image: '/marketing/team-flow.svg' },
      ]}
    />
  )
}
