import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, name, username } = await req.json()
    if (!email || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const storefrontUrl = `curatekin.com/${username ?? name.toLowerCase().replace(/\s/g, '')}`

    const { data, error } = await resend.emails.send({
      from: 'CurateKin <hello@curatekin.com>',
      to: email,
      subject: "You're approved — welcome to CurateKin",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#FAFAF8;font-family:system-ui,sans-serif;">
          <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
            
            <div style="margin-bottom:40px;">
              <span style="font-family:Georgia,serif;font-size:24px;font-weight:300;color:#141210;">
                Curate<em style="font-style:italic;color:#B07D4A;">Kin</em>
              </span>
            </div>

            <div style="background:#fff;border:0.5px solid rgba(20,18,16,0.1);padding:40px;margin-bottom:24px;">
              <p style="font-size:11px;letter-spacing:0.14em;color:#B07D4A;text-transform:uppercase;margin:0 0 16px;">APPLICATION STATUS</p>
              <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:400;color:#141210;margin:0 0 16px;line-height:1.2;">You're approved, ${name}.</h1>
              <p style="font-size:14px;color:#8C867E;line-height:1.7;margin:0 0 32px;">
                Welcome to CurateKin. Your creator account is live and your storefront is ready. Start adding products you love and share your link with your followers.
              </p>
              <div style="border-top:0.5px solid rgba(20,18,16,0.07);padding-top:24px;margin-bottom:32px;">
                <p style="font-size:12px;color:#8C867E;margin:0 0 8px;">Your storefront link</p>
                <p style="font-size:16px;color:#B07D4A;font-weight:500;margin:0;">${storefrontUrl}</p>
              </div>
              <a href="https://curatekin.com/login" style="display:inline-block;background:#141210;color:#fff;text-decoration:none;padding:14px 32px;font-size:12px;letter-spacing:0.1em;">
                GO TO YOUR DASHBOARD →
              </a>
            </div>

            <div style="background:#fff;border:0.5px solid rgba(20,18,16,0.1);padding:32px;margin-bottom:24px;">
              <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:400;color:#141210;margin:0 0 20px;">Get started in 3 steps</h2>
              <div style="display:flex;gap:16px;margin-bottom:16px;">
                <div style="width:28px;height:28px;border-radius:50%;background:#B07D4A;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:11px;color:#fff;font-weight:600;">1</span></div>
                <div><p style="font-size:13px;font-weight:500;color:#141210;margin:0 0 4px;">Add your first product</p><p style="font-size:12px;color:#8C867E;margin:0;line-height:1.5;">Go to My Products and add pieces you love.</p></div>
              </div>
              <div style="display:flex;gap:16px;margin-bottom:16px;">
                <div style="width:28px;height:28px;border-radius:50%;background:#B07D4A;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:11px;color:#fff;font-weight:600;">2</span></div>
                <div><p style="font-size:13px;font-weight:500;color:#141210;margin:0 0 4px;">Share your storefront</p><p style="font-size:12px;color:#8C867E;margin:0;line-height:1.5;">Copy your link and share it on Instagram or WhatsApp.</p></div>
              </div>
              <div style="display:flex;gap:16px;">
                <div style="width:28px;height:28px;border-radius:50%;background:#B07D4A;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:11px;color:#fff;font-weight:600;">3</span></div>
                <div><p style="font-size:13px;font-weight:500;color:#141210;margin:0 0 4px;">Earn commission</p><p style="font-size:12px;color:#8C867E;margin:0;line-height:1.5;">You earn 80% on every sale made through your link.</p></div>
              </div>
            </div>

            <div style="text-align:center;padding-top:8px;">
              <p style="font-size:11px;color:#C4BEB6;margin:0 0 8px;">Questions? <a href="mailto:hello@curatekin.com" style="color:#B07D4A;text-decoration:none;">hello@curatekin.com</a></p>
              <p style="font-size:11px;color:#C4BEB6;margin:0;">
                <a href="https://curatekin.com/terms" style="color:#C4BEB6;text-decoration:none;">Terms</a> · 
                <a href="https://curatekin.com/privacy" style="color:#C4BEB6;text-decoration:none;">Privacy</a> · 
                <a href="https://curatekin.com" style="color:#C4BEB6;text-decoration:none;">CurateKin</a>
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data?.id })

  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}