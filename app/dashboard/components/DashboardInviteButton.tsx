'use client'

import InviteClientDialog from '../clients/components/InviteClientDialog'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardInviteButton() {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Link href="/dashboard/forms">
        <Button variant="secondary" className="w-full sm:w-auto">
          Formularios
        </Button>
      </Link>
      <InviteClientDialog />
    </div>
  )
}
