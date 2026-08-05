import nodemailer from "nodemailer"

// Configuración SMTP desde variables de entorno
// En el LXC/Docker, configurar:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=tu-email@gmail.com
//   SMTP_PASS=tu-password-de-aplicacion
//   SMTP_FROM=tu-email@gmail.com

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null // SMTP no configurado
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendPasswordResetEmail(email: string, name: string, token: string, origin: string) {
  const transporter = getTransporter()
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@droglab.local"

  // Link de reset: https://<host>/?reset=<token>
  const resetLink = `${origin}/?reset=${token}`

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0d9488;">DrogLab — Recuperación de contraseña</h2>
      <p>Hola ${name},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en DrogLab.</p>
      <p>Hacé click en el siguiente enlace para crear una nueva contraseña:</p>
      <p style="margin: 20px 0;">
        <a href="${resetLink}"
           style="background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Restablecer contraseña
        </a>
      </p>
      <p style="color: #666; font-size: 12px;">
        Este enlace expira en 1 hora.<br>
        Si no solicitaste este cambio, ignorá este email.<br>
        DrogLab — Sistema de gestión de droguero
      </p>
    </div>
  `

  // Si SMTP no está configurado, loguear el link (para desarrollo)
  if (!transporter) {
    console.log(`\n=== EMAIL (SMTP no configurado) ===`)
    console.log(`Para: ${email}`)
    console.log(`Link de reset: ${resetLink}`)
    console.log(`===\n`)
    return { ok: true, dev: true, link: resetLink }
  }

  try {
    await transporter.sendMail({
      from: `DrogLab <${fromEmail}>`,
      to: email,
      subject: "DrogLab — Restablecer contraseña",
      html,
    })
    return { ok: true }
  } catch (e: any) {
    console.error("Error enviando email:", e)
    return { ok: false, error: e.message }
  }
}
