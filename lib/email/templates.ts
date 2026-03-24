import { APP_NAME, APP_TAGLINE, APP_URL, SUPPORT_EMAIL, getDisplayAppName } from '@/lib/branding'

function shell(title: string, eyebrow: string, content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#ffffff;">
        <div style="max-width:560px;margin:0 auto;padding:36px 16px;">
          <div style="margin-bottom:24px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;border:1px solid rgba(249,115,22,0.22);border-radius:999px;background:rgba(249,115,22,0.10);">
              <span style="font-size:12px;letter-spacing:0.18em;font-weight:800;color:#fdba74;">${APP_NAME.toUpperCase()}</span>
            </div>
          </div>

          <div style="background:linear-gradient(180deg, rgba(24,24,27,1) 0%, rgba(9,9,11,1) 100%);border:1px solid #27272a;border-radius:24px;padding:32px;">
            <p style="margin:0 0 8px;color:#fdba74;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">${eyebrow}</p>
            <h1 style="margin:0 0 12px;font-size:30px;line-height:1.1;color:#ffffff;">${title}</h1>
            <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.7;">${APP_TAGLINE}</p>
            ${content}
          </div>

          <p style="margin:18px 0 0;color:#52525b;font-size:12px;line-height:1.6;text-align:center;">
            ${APP_NAME} · ${APP_URL.replace(/^https?:\/\//, '')}<br />
            Soporte: ${SUPPORT_EMAIL}
          </p>
        </div>
      </body>
    </html>
  `
}

export function buildInviteEmail({
  trainerName,
  inviteUrl,
  hasForm,
}: {
  trainerName: string
  inviteUrl: string
  hasForm: boolean
}) {
  return shell(
    `${trainerName} te invitó a entrenar en ${APP_NAME}`,
    'Invitación',
    `
      <p style="margin:0 0 16px;color:#d4d4d8;font-size:15px;line-height:1.7;">
        Tu entrenador ya preparó tu acceso. Entra para crear tu cuenta y empezar a ver tu programa, progreso y seguimiento.
      </p>
      ${hasForm ? `
        <div style="margin:0 0 20px;padding:14px 16px;border-radius:16px;background:rgba(59,130,246,0.10);border:1px solid rgba(59,130,246,0.22);">
          <p style="margin:0;color:#bfdbfe;font-size:13px;line-height:1.6;">
            Después del registro completarás un breve formulario para personalizar tu entrenamiento desde el primer día.
          </p>
        </div>
      ` : ''}
      <a href="${inviteUrl}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;">
        Aceptar invitación
      </a>
      <p style="margin:18px 0 0;color:#71717a;font-size:12px;line-height:1.6;">
        Si el botón no abre, copia y pega este enlace:<br />
        <span style="color:#a1a1aa;word-break:break-all;">${inviteUrl}</span>
      </p>
    `
  )
}

export function buildAssignedContentEmail({
  appName,
  clientName,
  trainerName,
  message,
  ctaLabel,
  href,
}: {
  appName?: string | null
  clientName: string
  trainerName: string
  message: string
  ctaLabel: string
  href: string
}) {
  const label = getDisplayAppName(appName)
  return shell(
    message,
    label,
    `
      <p style="margin:0 0 18px;color:#d4d4d8;font-size:15px;line-height:1.7;">
        Hola <strong style="color:#ffffff;">${clientName}</strong>, ${trainerName} actualizó tu espacio en ${label}. Revisa los cambios y sigue avanzando.
      </p>
      <a href="${href}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;">
        ${ctaLabel}
      </a>
    `
  )
}

export function buildCheckinEmail({
  clientName,
  trainerName,
  checkinLabel,
  href,
}: {
  clientName: string
  trainerName: string
  checkinLabel: string
  href: string
}) {
  return shell(
    `${clientName} completó su ${checkinLabel}`,
    'Check-in',
    `
      <p style="margin:0 0 18px;color:#d4d4d8;font-size:15px;line-height:1.7;">
        Hola ${trainerName}, tu cliente <strong style="color:#ffffff;">${clientName}</strong> ya envió su ${checkinLabel}. Entra para revisar respuestas y tomar acción.
      </p>
      <a href="${href}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;">
        Revisar check-in
      </a>
    `
  )
}

export function buildVerificationEmail({
  fullName,
  verifyUrl,
  roleLabel,
}: {
  fullName: string
  verifyUrl: string
  roleLabel: string
}) {
  return shell(
    'Confirma tu cuenta y entra a Treinex',
    'Verificación',
    `
      <p style="margin:0 0 16px;color:#d4d4d8;font-size:15px;line-height:1.7;">
        Hola <strong style="color:#ffffff;">${fullName}</strong>, tu cuenta de ${roleLabel} ya está lista. Solo falta confirmar tu email para activar el acceso.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;">
        Confirmar email
      </a>
      <p style="margin:18px 0 0;color:#71717a;font-size:12px;line-height:1.6;">
        Este enlace de seguridad fue generado para tu registro en ${APP_NAME}. Si no solicitaste esta cuenta, puedes ignorar este correo.
      </p>
    `
  )
}
