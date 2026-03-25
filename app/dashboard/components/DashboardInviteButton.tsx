'use client'

import InviteClientDialog from '../clients/components/InviteClientDialog'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DashboardInviteButton() {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Link href="/dashboard/forms">
        <Button variant="outline" className="w-full border-stone-200 bg-white text-stone-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 sm:w-auto">
          Formularios
        </Button>
      </Link>
      <InviteClientDialog />
    </div>
  )
}
