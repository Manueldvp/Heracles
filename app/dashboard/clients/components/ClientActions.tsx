'use client'

import InviteButton from './InviteButton'
import DeleteClientButton from '../[id]/components/DeleteClientButton'

export default function ClientActions({ clientId, clientName, email }: {
  clientId: string
  clientName: string
  email: string
}) {
  return (
    <div
      className="flex gap-2 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <InviteButton clientId={clientId} email={email} />
      <DeleteClientButton clientId={clientId} clientName={clientName} />
    </div>
  )
}