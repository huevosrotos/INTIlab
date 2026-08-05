import nodemailer from "nodemailer"
import { getSettings } from "@/lib/settings"

async function getSmtpConfig() {
  const settings = await getSettings([
    "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from",
  ])
  return {
    host: settings.smtp_host,
    port: Number(settings.smtp_port || "587"),
    user: settings.smtp_user,
    pass: settings.smtp_pass,
    from: settings.smtp_from || settings.smtp_user,
  }
}

export async function sendPasswordResetEmail(email: string, name: string, token: string, origin: string) {
  const config = await getSmtpConfig()
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
  if (!config.host || !config.user || !config.pass) {
    console.log(`\n=== EMAIL (SMTP no configurado) ===`)
    console.log(`Para: ${email}`)
    console.log(`Link de reset: ${resetLink}`)
    console.log(`===\n`)
    return { ok: true, dev: true, link: resetLink }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    })

    await transporter.sendMail({
      from: `DrogLab <${config.from}>`,
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

export async function sendTestEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  const config = await getSmtpConfig()

  if (!config.host || !config.user || !config.pass) {
    return { ok: false, error: "SMTP no configurado. Configure los parámetros primero." }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    })

    await transporter.sendMail({
      from: `DrogLab <${config.from}>`,
      to,
      subject: "DrogLab — Email de prueba",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #0d9488;">Email de prueba</h2>
          <p>Si recibiste este email, la configuración SMTP funciona correctamente.</p>
          <p style="color: #666; font-size: 12px;">DrogLab — Sistema de gestión de droguero</p>
        </div>
      `,
    })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}
