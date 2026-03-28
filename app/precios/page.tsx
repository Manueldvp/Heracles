import { CreditCard, ShieldCheck, Zap } from 'lucide-react'
import MarketingPageShell from '@/components/marketing/marketing-page-shell'

export default function PreciosPage() {
  return (
    <MarketingPageShell
      eyebrow="Precios"
      title="Empieza gratis y pasa a premium cuando tu cartera crece"
      description="Treinex acompaña tu crecimiento con una estructura simple: hasta 5 clientes gratis, y premium cuando necesitas escalar, automatizar y usar IA sin límites."
      heroPoints={['0 a 5 clientes: gratis', '6+ clientes: plan premium', 'Modelo simple y claro para crecer']}
      sections={[
        { title: 'Plan Free', copy: 'Empieza con lo esencial y valida tu operación antes de escalar.', icon: CreditCard },
        { title: 'Plan Premium', copy: 'Desbloquea más clientes, más automatización y una operación más sólida.', icon: Zap },
        { title: 'Control total', copy: 'Límites, uso y estado de tu cuenta visibles dentro del producto.', icon: ShieldCheck },
      ]}
      visuals={[
        { title: 'Cuenta con control', copy: 'Mide clientes activos, uso de IA y necesidad de upgrade desde el panel.', image: '/marketing/pricing-overview.svg' },
        { title: 'Escala sin fricción', copy: 'La transición de free a premium se integra en tu flujo real de trabajo.', image: '/marketing/scale-visual.svg' },
      ]}
    />
  )
}
