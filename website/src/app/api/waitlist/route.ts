import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { z } from 'zod';
import { Resend } from 'resend';
import { getCdnUrl } from '@/lib/utils/cdn';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = emailSchema.parse(body);
    
    const supabase = createAdminClient()

    const { error: supabaseError } = await supabase
      .from('waitlist')
      .insert([{ email }]);

    if (supabaseError) {
      console.error('Supabase error details:', supabaseError);
      // Handle unique constraint violation
      if (supabaseError.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already on the waitlist' },
          { status: 400 }
        );
      }
      throw supabaseError;
    }

    // Add contact to Resend Audience (if configured)
    let addedToAudience = false;
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    
    if (audienceId) {
      try {
        await resend.contacts.create({
          email,
          audienceId,
        });
        addedToAudience = true;
        console.log(`Contact ${email} added to Resend Audience ${audienceId}`);
      } catch (audienceError: any) {
        // Don't fail the entire request if audience addition fails
        console.error('Failed to add contact to Resend Audience:', audienceError);
        
        // Check if contact already exists in audience (this is OK)
        if (audienceError?.message?.includes('already exists') || 
            audienceError?.message?.includes('Contact already exists')) {
          console.log(`Contact ${email} already exists in Resend Audience`);
          addedToAudience = true;
        }
      }
    } else {
      console.warn('RESEND_AUDIENCE_ID not configured - skipping audience addition');
    }

    // Send welcome email
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Primeshot <team@mail.primeshot.ai>',
      to: [email],
      subject: "Your Primeshot Beta Invite is Coming Soon 🚀",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <img src="${getCdnUrl('email/logo.png')}" alt="Primeshot" style="width: 64px; height: 64px; margin-bottom: 20px; margin-top: 20px;" />
          <h1 style="color: #052322; text-align: left;">You're on the waitlist!</h1>
          <p style="color: #666; font-size: 16px;">
            Great news! We’re excited to let you know that Primeshot is ready for beta! 🎉
            <br />
            As a valued waitlist member, you’ll be among the very first to try it out.
          </p>
          <div style="background: #E5FBFA; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #000; font-size: 14px;">
              <strong>What to expect:</strong>
              <br /> 
              <br />
              Your exclusive beta invite link will be landing in your inbox very soon. As a thank-you for joining early, you’ll also unlock a special lifetime offer when you subscribe during this beta phase.
            </p>
          </div>
          <p style="color: #666; font-size: 16px;">
            Get ready! You’re about to experience Primeshot before anyone else.
          </p>
          <p style="color: #666; font-size: 16px;">
            In the meantime, keep an eye on your inbox for updates, and feel free to <a href="https://x.com/primeshotai" style="color: #148580; text-decoration: none;">follow us on X</a> for behind-the-scenes updates.
          </p>
          <p style="color: #666; font-size: 16px; margin-top: 30px;">
            We're thrilled to have you with us, 
            <br /><br />
              <img src="${getCdnUrl('email/sig.png')}" alt="David and Rich" style="width: 132px; height: 48px;" />
            <br />
            <span style="color: #999; font-size: 14px;">Founders of Primeshot</span>
          </p>
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 40px;">
            Sent from the official Primeshot waitlist system.
          </p>
        </div>
      `,
      text: "Thanks for joining PrimeShot! You're now on our waitlist and we'll notify you when we launch."
    });

    if (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue - user still added to waitlist successfully
    }

    return NextResponse.json(
      { 
        message: 'Thanks! You\'re on the waitlist.',
        emailSent: !emailError,
        addedToAudience 
      },
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Waitlist submission error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
} 