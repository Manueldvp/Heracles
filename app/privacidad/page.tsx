import { EyeOff, FileLock2, ShieldCheck } from 'lucide-react'
import MarketingPageShell from '@/components/marketing/marketing-page-shell'

export default function PrivacidadPage() {
  return (
    <MarketingPageShell
      eyebrow="Privacidad"
      title="Privacidad clara para entrenadores y clientes que comparten información sensible"
      description="Treinex se diseña para que datos de progreso, nutrición y seguimiento tengan una presentación clara, controlada y alineada con una experiencia SaaS confiable."
      heroPoints={['Datos de cliente con contexto controlado', 'Accesos diferenciados por rol', 'Diseño centrado en claridad y mínima fricción']}
      sections={[
        { title: 'Visibilidad adecuada', copy: 'Cada usuario ve la información que necesita para su flujo.', icon: EyeOff },
        { title: 'Datos con estructura', copy: 'Check-ins, notas y planes viven en superficies ordenadas.', icon: FileLock2 },
        { title: 'Confianza en el producto', copy: 'Privacidad también es una experiencia consistente y entendible.', icon: ShieldCheck },
      ]}
      visuals={[
        { title: 'Contexto por rol', copy: 'Entrenador y cliente comparten la información correcta en cada interfaz.', image: '/marketing/privacy-role.svg' },
        { title: 'Pantallas limpias', copy: 'Diseño y privacidad trabajan juntos cuando todo está bien jerarquizado.', image: '/marketing/privacy-ui.svg' },
      ]}
    />
  )
}
