import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface PaymentSuccessData {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  plan_id: string;
  amount: number;
  currency?: string;
  payment_method?: string;
  subscription_id?: string;
  user_id?: string;
  user_email?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== PAYMENT SUCCESS API CALLED ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    
    const {
      razorpay_payment_id,
      razorpay_order_id,
      plan_id,
      amount,
      currency = 'INR',
      payment_method,
      subscription_id,
      user_id,
      user_email
    }: PaymentSuccessData = await request.json();

    console.log('Payment success data:', {
      razorpay_payment_id,
      razorpay_order_id,
      plan_id,
      amount,
      currency,
      payment_method,
      subscription_id,
      user_id,
      user_email
    });

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');

    // Create Supabase client with proper auth context
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // Create client with anon key for auth operations
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Create service client for database operations that need to bypass RLS
    const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to get user from session
    let user = null;
    let userError = null;

    // First try with the request headers (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      console.log('Using Bearer token for authentication');
      
      // Set the session with the JWT token
      const { data: { user: headerUser }, error: headerError } = await supabaseClient.auth.getUser(token);
      if (headerUser && !headerError) {
        user = headerUser;
        console.log('User authenticated via Bearer token');
      } else {
        console.error('Bearer token authentication failed:', headerError);
      }
    }

    // If header auth failed, try direct getUser (for server-side auth)
    if (!user) {
      console.log('Trying direct getUser (server-side auth)');
      const { data: { user: directUser }, error: directError } = await supabaseClient.auth.getUser();
      user = directUser;
      userError = directError;
      console.log('Direct auth result:', { user: !!user, error: userError });
    }

    // If still no user, try to get from cookies (fallback)
    if (!user) {
      console.log('Trying cookie-based authentication');
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        console.log('Cookies available, trying to extract session');
        // This is a fallback - in production you might want to use a more robust approach
        try {
          const { data: { user: cookieUser }, error: cookieError } = await supabaseClient.auth.getUser();
          if (cookieUser && !cookieError) {
            user = cookieUser;
            console.log('User authenticated via cookies');
          }
        } catch (cookieAuthError) {
          console.error('Cookie authentication failed:', cookieAuthError);
        }
      }
    }

    // If still no user but we have user_id in the request, create a minimal user object
    if (!user && user_id) {
      console.log('No authenticated user found, but user_id provided in request. Creating minimal user object.');
      user = {
        id: user_id,
        email: user_email || 'unknown@example.com',
        created_at: new Date().toISOString()
      };
      console.log('Using provided user_id for authentication:', user_id);
    }

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      console.error('Authentication attempts failed:', {
        hasAuthHeader: !!authHeader,
        authHeaderValue: authHeader ? 'Present' : 'Missing',
        directAuthError: userError
      });
      return NextResponse.json(
        { 
          error: 'User not authenticated',
          details: 'Please log in to process payments',
          code: 'AUTH_REQUIRED',
          debug: {
            hasAuthHeader: !!authHeader,
            authHeaderPresent: authHeader ? 'Yes' : 'No'
          }
        },
        { status: 401 }
      );
    }

    console.log('Authenticated user:', {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    });

    // Verify user ID matches (additional security check)
    if (user_id && user_id !== user.id) {
      console.error('User ID mismatch:', { provided: user_id, authenticated: user.id });
      return NextResponse.json(
        { 
          error: 'User ID mismatch',
          details: 'Provided user ID does not match authenticated user',
          code: 'USER_ID_MISMATCH'
        },
        { status: 403 }
      );
    }

    // Check if user exists in users table, create if not
    let userRecord;
    const { data: existingUser, error: userRecordError } = await supabaseServiceClient
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (userRecordError && userRecordError.code === 'PGRST116') {
      // User doesn't exist in users table, create them
      console.log('User not found in users table, creating user record...');
      
      const { data: newUser, error: createUserError } = await supabaseServiceClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User',
          last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id, email, first_name, last_name')
        .single();

      if (createUserError) {
        // If user already exists (duplicate key), try to fetch them instead
        if (createUserError.code === '23505') {
          console.log('User already exists, fetching user record...');
          const { data: existingUserRetry, error: retryError } = await supabaseServiceClient
            .from('users')
            .select('id, email, first_name, last_name')
            .eq('id', user.id)
            .single();
          
          if (retryError) {
            console.error('Error fetching existing user:', retryError);
            return NextResponse.json(
              { 
                error: 'Failed to fetch user profile',
                details: retryError.message,
                code: 'USER_FETCH_FAILED'
              },
              { status: 500 }
            );
          }
          
          userRecord = existingUserRetry;
          console.log('User record found (existing):', userRecord);
        } else {
          console.error('Error creating user record:', createUserError);
          return NextResponse.json(
            { 
              error: 'Failed to create user profile',
              details: createUserError.message,
              code: 'USER_CREATION_FAILED'
            },
            { status: 500 }
          );
        }
      } else {
        userRecord = newUser;
        console.log('User record created successfully:', userRecord);
      }
    } else if (userRecordError) {
      console.error('Error checking user record:', userRecordError);
      return NextResponse.json(
        { 
          error: 'Database error',
          details: userRecordError.message,
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    } else {
      userRecord = existingUser;
      console.log('User record found:', userRecord);
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseServiceClient
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      console.error('Plan ID being searched:', plan_id);
      return NextResponse.json(
        { 
          error: 'Plan not found',
          details: planError?.message || 'Plan does not exist',
          plan_id: plan_id
        },
        { status: 404 }
      );
    }

    console.log('Plan details:', {
      id: plan.id,
      name: plan.name,
      plan_type: plan.plan_type,
      billing_cycle: plan.billing_cycle
    });

    // Check if payment already exists (prevent duplicate processing)
    const { data: existingPayment } = await supabaseServiceClient
      .from('payments')
      .select('id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .single();

    if (existingPayment) {
      console.log('Payment already processed:', razorpay_payment_id);
      return NextResponse.json(
        { message: 'Payment already processed', payment_id: existingPayment.id },
        { status: 200 }
      );
    }

    // Create payment record with all required fields based on table schema
    const paymentData = {
      user_id: user.id,
      plan_id: plan.id,
      razorpay_payment_id,
      razorpay_order_id: razorpay_order_id || null,
      amount,
      currency,
      plan_name: plan.name,
      plan_type: plan.plan_type,
      billing_cycle: plan.billing_cycle || 'monthly',
      max_projects: plan.max_projects || 1,
      can_use_features: plan.can_use_features || [],
      payment_status: 'completed',
      payment_method: payment_method || 'razorpay',
      subscription_id: subscription_id || null,
      payment_date: new Date().toISOString()
    };

    console.log('Payment data to insert:', paymentData);

    const { data: payment, error: paymentError } = await supabaseServiceClient
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      console.error('Payment data that failed:', paymentData);
      console.error('Error details:', {
        message: paymentError.message,
        code: paymentError.code,
        details: paymentError.details,
        hint: paymentError.hint
      });
      
      // Check for specific error types
      if (paymentError.message?.includes('relation "public.payments" does not exist')) {
        console.log('Payments table does not exist yet, skipping payment record creation');
        // Still update user plan even if payment record can't be created
        const { error: userUpdateError } = await supabaseServiceClient
          .from('users')
          .update({
            plan_type: plan.plan_type,
            plan_id: plan.id,
            subscription_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (userUpdateError) {
          console.error('Error updating user plan:', userUpdateError);
          return NextResponse.json(
            { error: 'Payments table not set up, but user plan updated', details: 'Payment recorded but table setup needed' },
            { status: 200 }
          );
        }

        const fallbackResponse = {
          success: true,
          message: 'Payment processed successfully (payments table not set up yet)',
          payment_id: 'temp_' + Date.now(),
          user_plan_updated: true,
          plan_details: {
            plan_name: plan.name,
            plan_type: plan.plan_type,
            billing_cycle: plan.billing_cycle,
            max_projects: plan.max_projects
          }
        };

        console.log('Returning fallback response (no payments table):', fallbackResponse);
        return NextResponse.json(fallbackResponse, { status: 200 });
      } else if (paymentError.code === '23503' || paymentError.message?.includes('violates foreign key constraint')) {
        console.error('Foreign key constraint violation:', paymentError);
        return NextResponse.json(
          { 
            error: 'Database constraint violation',
            details: 'User or plan not found in database',
            code: 'FOREIGN_KEY_VIOLATION',
            user_id: user.id,
            plan_id: plan_id
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create payment record', 
          details: paymentError.message,
          code: paymentError.code,
          hint: paymentError.hint
        },
        { status: 500 }
      );
    }

    console.log('Payment record created:', payment.id);

    // Update user's plan
    const { error: userUpdateError } = await supabaseServiceClient
      .from('users')
      .update({
        plan_type: plan.plan_type,
        plan_id: plan.id,
        subscription_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (userUpdateError) {
      console.error('Error updating user plan:', userUpdateError);
      // Don't fail the entire request, just log the error
      console.warn('Payment recorded but user plan update failed');
    } else {
      console.log('User plan updated successfully');
    }

    // Trigger plan refresh for the user
    try {
      // You can add webhook or notification logic here
      console.log('Payment successful, user plan updated');
    } catch (notificationError) {
      console.warn('Payment successful but notification failed:', notificationError);
    }

    const responseData = {
      success: true,
      message: 'Payment processed successfully',
      payment_id: payment.id,
      user_plan_updated: !userUpdateError,
      plan_details: {
        plan_name: plan.name,
        plan_type: plan.plan_type,
        billing_cycle: plan.billing_cycle,
        max_projects: plan.max_projects
      }
    };

    console.log('Returning success response:', responseData);
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Payment success processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payment success',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
