import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildWhatsAppLink } from '@/lib/public-trainers'

type Props = {
  trainerId: string
  trainerName: string
  whatsappNumber?: string | null
  className?: string
}

export default function PublicTrainerActions({
  trainerId,
  trainerName,
  whatsappNumber,
  className = '',
}: Props) {
  const whatsappLink = buildWhatsAppLink(trainerName, whatsappNumber)

  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`.trim()}>
      <Button asChild className="h-11 rounded-full px-6">
        <Link href={`/apply/${trainerId}`}>
          Trabajar conmigo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>

      {whatsappLink ? (
        <Button asChild variant="outline" className="h-11 rounded-full px-6">
          <a href={whatsappLink} target="_blank" rel="noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Contactar por WhatsApp
          </a>
        </Button>
      ) : null}
    </div>
  )
}
