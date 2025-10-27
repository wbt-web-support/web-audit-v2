import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'homepage' } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail, error: checkError } = await supabase
      .from('notify_me')
      .select('id, email, is_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing email:', checkError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    if (existingEmail) {
      if (existingEmail.is_active) {
        return NextResponse.json(
          { 
            message: 'You\'re already on our notification list! We\'ll notify you when we launch.',
            alreadySubscribed: true 
          },
          { status: 200 }
        );
      } else {
        // Reactivate the subscription
        const { error: updateError } = await supabase
          .from('notify_me')
          .update({ 
            is_active: true, 
            updated_at: new Date().toISOString(),
            source 
          })
          .eq('id', existingEmail.id);

        if (updateError) {
          console.error('Error reactivating subscription:', updateError);
          return NextResponse.json(
            { error: 'Failed to reactivate subscription' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { 
            message: 'Welcome back! We\'ve reactivated your notification subscription.',
            reactivated: true 
          },
          { status: 200 }
        );
      }
    }

    // Insert new email
    const { data, error } = await supabase
      .from('notify_me')
      .insert([
        {
          email: email.toLowerCase().trim(),
          source,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting email:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe to notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Thank you! We\'ll notify you when we launch.',
        success: true,
        id: data.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in notify-me API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

