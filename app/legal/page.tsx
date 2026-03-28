import { FileCheck2, Scale, Shield } from 'lucide-react'
import MarketingPageShell from '@/components/marketing/marketing-page-shell'

export default function LegalPage() {
  return (
    <MarketingPageShell
      eyebrow="Legal"
      title="Base legal clara para una operación profesional y sostenible"
      description="Esta página resume el enfoque legal del producto: uso responsable, separación de responsabilidades y condiciones claras para entrenadores y clientes."
      heroPoints={['Términos claros', 'Uso responsable de la plataforma', 'Base para operación profesional']}
      sections={[
        { title: 'Condiciones de uso', copy: 'Define cómo se utiliza la plataforma y qué se espera de cada cuenta.', icon: FileCheck2 },
        { title: 'Responsabilidad', copy: 'Treinex organiza operación, pero no reemplaza criterio profesional ni médico.', icon: Scale },
        { title: 'Protección', copy: 'Buscamos una experiencia de producto consistente, entendible y confiable.', icon: Shield },
      ]}
      visuals={[
        { title: 'Documento vivo', copy: 'Preparado para evolucionar junto al producto y sus necesidades reales.', image: '/marketing/legal-docs.svg' },
        { title: 'Operación responsable', copy: 'El marco legal acompaña un servicio serio y bien presentado.', image: '/marketing/legal-ops.svg' },
      ]}
    />
  )
}
