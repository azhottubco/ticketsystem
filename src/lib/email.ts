import nodemailer from 'nodemailer'

const transport = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const FROM = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@engrainai.com'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Engrain AI Support'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#0f172a;padding:20px 32px;">
          <span style="color:#fff;font-size:18px;font-weight:bold;">${APP_NAME}</span>
        </td></tr>
        <tr><td style="padding:28px 32px;color:#334155;font-size:14px;line-height:1.6;">
          ${content}
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
          This is an automated message from ${APP_NAME}. Please do not reply to this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(to: string, name: string, tempPassword: string) {
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Welcome to ${APP_NAME}</h2>
    <p>Hi ${name || to},</p>
    <p>An account has been created for you. Here are your login details:</p>
    <table style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;width:100%;box-sizing:border-box;">
      <tr><td style="padding:4px 0;color:#64748b;">Email:</td><td style="font-weight:bold;">${to}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Temporary Password:</td><td style="font-weight:bold;font-family:monospace;font-size:15px;">${tempPassword}</td></tr>
    </table>
    <p style="color:#dc2626;font-weight:bold;">You will be required to change your password on first login.</p>
    <p><a href="${APP_URL}/login" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Log In Now</a></p>
  `)

  await transport.sendMail({ from: FROM, to, subject: `Welcome to ${APP_NAME} — Your Account Details`, html })
}

export async function sendNewTicketEmail(
  adminEmails: string[],
  ticket: { id: string; title: string; priority: string; creatorName: string | null; creatorEmail: string }
) {
  if (!adminEmails.length) return
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">New Support Ticket Submitted</h2>
    <p>A new ticket has been submitted and requires attention.</p>
    <table style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;width:100%;box-sizing:border-box;">
      <tr><td style="padding:4px 0;color:#64748b;width:120px;">Ticket:</td><td><a href="${APP_URL}/tickets/${ticket.id}" style="color:#2563eb;">${ticket.title}</a></td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Priority:</td><td style="text-transform:capitalize;">${ticket.priority}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Submitted by:</td><td>${ticket.creatorName || ticket.creatorEmail}</td></tr>
    </table>
    <p><a href="${APP_URL}/tickets/${ticket.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Ticket</a></p>
  `)

  await transport.sendMail({ from: FROM, to: adminEmails, subject: `[New Ticket] ${ticket.title}`, html })
}

export async function sendStatusChangeEmail(
  to: string,
  ticket: { id: string; title: string; status: string }
) {
  const statusLabel: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  }
  const label = statusLabel[ticket.status] ?? ticket.status
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Ticket Status Updated</h2>
    <p>The status of your support ticket has been updated.</p>
    <table style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;width:100%;box-sizing:border-box;">
      <tr><td style="padding:4px 0;color:#64748b;width:120px;">Ticket:</td><td><a href="${APP_URL}/tickets/${ticket.id}" style="color:#2563eb;">${ticket.title}</a></td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">New Status:</td><td style="font-weight:bold;">${label}</td></tr>
    </table>
    <p><a href="${APP_URL}/tickets/${ticket.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Ticket</a></p>
  `)

  await transport.sendMail({ from: FROM, to, subject: `[Ticket Update] ${ticket.title} — ${label}`, html })
}

export async function sendNewCommentEmail(
  recipients: string[],
  ticket: { id: string; title: string },
  commenterName: string
) {
  if (!recipients.length) return
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">New Comment on Your Ticket</h2>
    <p><strong>${commenterName}</strong> added a comment on your support ticket.</p>
    <table style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;width:100%;box-sizing:border-box;">
      <tr><td style="padding:4px 0;color:#64748b;width:120px;">Ticket:</td><td><a href="${APP_URL}/tickets/${ticket.id}" style="color:#2563eb;">${ticket.title}</a></td></tr>
    </table>
    <p><a href="${APP_URL}/tickets/${ticket.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Comment</a></p>
  `)

  await transport.sendMail({ from: FROM, to: recipients, subject: `[New Comment] ${ticket.title}`, html })
}

export async function sendAttachmentEmail(
  recipients: string[],
  ticket: { id: string; title: string },
  uploaderName: string,
  filename: string
) {
  if (!recipients.length) return
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">New Attachment on Your Ticket</h2>
    <p><strong>${uploaderName}</strong> added an attachment to your support ticket.</p>
    <table style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;width:100%;box-sizing:border-box;">
      <tr><td style="padding:4px 0;color:#64748b;width:120px;">Ticket:</td><td><a href="${APP_URL}/tickets/${ticket.id}" style="color:#2563eb;">${ticket.title}</a></td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">File:</td><td>${filename}</td></tr>
    </table>
    <p><a href="${APP_URL}/tickets/${ticket.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Ticket</a></p>
  `)

  await transport.sendMail({ from: FROM, to: recipients, subject: `[New Attachment] ${ticket.title}`, html })
}

export async function sendPriorityChangeEmail(
  to: string,
  ticket: { id: string; title: string; priority: string }
) {
  const priorityLabel: Record<string, string> = {
    low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
  }
  const label = priorityLabel[ticket.priority] ?? ticket.priority
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Ticket Priority Updated</h2>
    <p>The priority of your support ticket has been updated.</p>
    <table style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;width:100%;box-sizing:border-box;">
      <tr><td style="padding:4px 0;color:#64748b;width:120px;">Ticket:</td><td><a href="${APP_URL}/tickets/${ticket.id}" style="color:#2563eb;">${ticket.title}</a></td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">New Priority:</td><td style="font-weight:bold;">${label}</td></tr>
    </table>
    <p><a href="${APP_URL}/tickets/${ticket.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Ticket</a></p>
  `)

  await transport.sendMail({ from: FROM, to, subject: `[Ticket Update] ${ticket.title} — Priority Changed`, html })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Reset Your Password</h2>
    <p>We received a request to reset the password for your account.</p>
    <p>Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
    <p style="margin:24px 0;"><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
    <p style="color:#64748b;font-size:13px;">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
  `)
  await transport.sendMail({ from: FROM, to, subject: `${APP_NAME} — Password Reset Request`, html })
}

export async function sendAssignmentEmail(
  to: string,
  ticket: { id: string; title: string; priority: string; creatorName: string | null; creatorEmail: string }
) {
  const html = wrap(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Ticket Assigned to You</h2>
    <p>A support ticket has been assigned to you.</p>
    <table style="margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;width:100%;box-sizing:border-box;">
      <tr><td style="padding:4px 0;color:#64748b;width:120px;">Ticket:</td><td><a href="${APP_URL}/tickets/${ticket.id}" style="color:#2563eb;">${ticket.title}</a></td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Priority:</td><td style="text-transform:capitalize;">${ticket.priority}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Submitted by:</td><td>${ticket.creatorName || ticket.creatorEmail}</td></tr>
    </table>
    <p><a href="${APP_URL}/tickets/${ticket.id}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Ticket</a></p>
  `)

  await transport.sendMail({ from: FROM, to, subject: `[Ticket Assigned] ${ticket.title}`, html })
}
