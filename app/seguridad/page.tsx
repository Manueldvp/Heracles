import { LockKeyhole, ShieldCheck, UserRoundCheck } from 'lucide-react'
import MarketingPageShell from '@/components/marketing/marketing-page-shell'

export default function SeguridadPage() {
  return (
    <MarketingPageShell
      eyebrow="Seguridad"
      title="Datos sensibles, acceso controlado y flujos claros para operar con confianza"
      description="La seguridad en Treinex se apoya en autenticación, separación de roles y flujos de acceso consistentes para entrenadores y clientes."
      heroPoints={['Acceso por sesión autenticada', 'Separación de panel trainer/client', 'Información centralizada y trazable']}
      sections={[
        { title: 'Control de acceso', copy: 'Cada rol entra a la superficie que le corresponde sin mezclar contextos.', icon: LockKeyhole },
        { title: 'Confianza operativa', copy: 'Menos confusión en flujos significa menos riesgo humano.', icon: ShieldCheck },
        { title: 'Experiencia cuidada', copy: 'El diseño también ayuda a prevenir errores de uso.', icon: UserRoundCheck },
      ]}
      visuals={[
        { title: 'Panel con contexto', copy: 'Entrenadores y clientes ven interfaces coherentes y estables.', image: '/marketing/security-panels.svg' },
        { title: 'Seguimiento seguro', copy: 'La información importante vive dentro de rutas y acciones controladas.', image: '/marketing/security-flow.svg' },
      ]}
    />
  )
}
