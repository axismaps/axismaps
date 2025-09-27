import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  message: z.string().min(10),
})

// Rate limiting: Simple in-memory store (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitStore.get(ip)

  if (!limit || now > limit.resetTime) {
    // Reset or initialize: 5 requests per 10 minutes
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + 10 * 60 * 1000, // 10 minutes
    })
    return true
  }

  if (limit.count >= 5) {
    return false // Rate limit exceeded
  }

  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    const validatedData = contactSchema.safeParse(body)
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid form data. Please check your inputs.' },
        { status: 400 }
      )
    }

    const { name, email, company, message } = validatedData.data

    // Prepare email content
    const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        Sent from the Axis Maps contact form at ${new Date().toISOString()}
      </p>
    `

    const emailText = `
      New Contact Form Submission

      Name: ${name}
      Email: ${email}
      ${company ? `Company: ${company}` : ''}

      Message:
      ${message}

      ---
      Sent from the Axis Maps contact form at ${new Date().toISOString()}
    `

    // Get the sending email from environment or use default
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const toEmail = process.env.RESEND_REPLY_TO_EMAIL || 'info@axismaps.com'

    // Send email using Resend
    const { error } = await resend.emails.send({
      from: `Axis Maps Contact <${fromEmail}>`,
      to: [toEmail],
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: emailHtml,
      text: emailText,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      )
    }

    // Send auto-reply to the user (optional)
    // Only send if not using the default Resend email
    if (fromEmail !== 'onboarding@resend.dev') {
      await resend.emails.send({
        from: `Axis Maps <${fromEmail}>`,
        to: [email],
        subject: 'Thank you for contacting Axis Maps',
        html: `
          <h2>Thank you for reaching out!</h2>
          <p>Hi ${name},</p>
          <p>We've received your message and will get back to you as soon as possible.</p>
          <p>If you have any urgent inquiries, feel free to email us directly at ${toEmail}.</p>
          <p>Best regards,<br>The Axis Maps Team</p>
        `,
        text: `
          Thank you for reaching out!

          Hi ${name},

          We've received your message and will get back to you as soon as possible.

          If you have any urgent inquiries, feel free to email us directly at ${toEmail}.

          Best regards,
          The Axis Maps Team
        `,
      })
    }

    return NextResponse.json(
      { success: true, message: 'Email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint for health check
export async function GET() {
  return NextResponse.json({ status: 'Contact API is running' })
}
