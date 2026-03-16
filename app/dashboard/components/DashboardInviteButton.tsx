'use client'

import InviteClientDialog from '../clients/components/InviteClientDialog'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardInviteButton() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard/forms">
        <Button variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 gap-1.5">
          <FileText size={15} />
          Formularios
        </Button>
      </Link>
      <InviteClientDialog />
    </div>
  )
}
