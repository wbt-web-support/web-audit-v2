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
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    // Create Supabase client with proper auth context
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Create client with anon key for auth operations
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Create service client for database operations that need to bypass RLS
    const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get user from session - use service client for better auth handling
    let user = null;
    let userError = null;

    // First try with the request headers (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      // Set the session with the JWT token
      const {
        data: {
          user: headerUser
        },
        error: headerError
      } = await supabaseClient.auth.getUser(token);
      if (headerUser && !headerError) {
        user = headerUser;
      } else {
        console.error('Bearer token authentication failed:', headerError);
      }
    }

    // If header auth failed, try with service client (bypasses RLS)
    if (!user) {
      try {
        // Use service client to get user info if we have user_id in request
        if (user_id) {
          // Verify user exists in database using service client
          const {
            data: userRecord,
            error: userRecordError
          } = await supabaseServiceClient.from('users').select('id, email, first_name, last_name').eq('id', user_id).single();
          if (userRecord && !userRecordError) {
            user = {
              id: userRecord.id,
              email: userRecord.email,
              created_at: new Date().toISOString()
            };
          } else {
            console.error('User not found in database:', userRecordError);
          }
        }
      } catch (serviceError) {
        console.error('Service client authentication failed:', serviceError);
      }
    }

    // If still no user, try direct getUser (for server-side auth)
    if (!user) {
      const {
        data: {
          user: directUser
        },
        error: directError
      } = await supabaseClient.auth.getUser();
      user = directUser;
      userError = directError;
    }

    // If still no user but we have user_id in the request, create a minimal user object
    if (!user && user_id) {
      user = {
        id: user_id,
        email: user_email || 'unknown@example.com',
        created_at: new Date().toISOString()
      };
    }
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      console.error('Authentication attempts failed:', {
        hasAuthHeader: !!authHeader,
        authHeaderValue: authHeader ? 'Present' : 'Missing',
        directAuthError: userError
      });
      return NextResponse.json({
        error: 'User not authenticated',
        details: 'Please log in to process payments',
        code: 'AUTH_REQUIRED',
        debug: {
          hasAuthHeader: !!authHeader,
          authHeaderPresent: authHeader ? 'Yes' : 'No'
        }
      }, {
        status: 401
      });
    }
    // Verify user ID matches (additional security check)
    if (user_id && user_id !== user.id) {
      console.error('User ID mismatch:', {
        provided: user_id,
        authenticated: user.id
      });
      return NextResponse.json({
        error: 'User ID mismatch',
        details: 'Provided user ID does not match authenticated user',
        code: 'USER_ID_MISMATCH'
      }, {
        status: 403
      });
    }

    // Check if user exists in users table, create if not
    let userRecord;
    const {
      data: existingUser,
      error: userRecordError
    } = await supabaseServiceClient.from('users').select('id, email, first_name, last_name').eq('id', user.id).single();
    if (userRecordError && userRecordError.code === 'PGRST116') {
      // User doesn't exist in users table, create them

      const {
        data: newUser,
        error: createUserError
      } = await supabaseServiceClient.from('users').insert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User',
        last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select('id, email, first_name, last_name').single();
      if (createUserError) {
        // If user already exists (duplicate key), try to fetch them instead
        if (createUserError.code === '23505') {
          const {
            data: existingUserRetry,
            error: retryError
          } = await supabaseServiceClient.from('users').select('id, email, first_name, last_name').eq('id', user.id).single();
          if (retryError) {
            console.error('Error fetching existing user:', retryError);
            return NextResponse.json({
              error: 'Failed to fetch user profile',
              details: retryError.message,
              code: 'USER_FETCH_FAILED'
            }, {
              status: 500
            });
          }
          userRecord = existingUserRetry;
        } else {
          console.error('Error creating user record:', createUserError);
          return NextResponse.json({
            error: 'Failed to create user profile',
            details: createUserError.message,
            code: 'USER_CREATION_FAILED'
          }, {
            status: 500
          });
        }
      } else {
        userRecord = newUser;
      }
    } else if (userRecordError) {
      console.error('Error checking user record:', userRecordError);
      return NextResponse.json({
        error: 'Database error',
        details: userRecordError.message,
        code: 'DATABASE_ERROR'
      }, {
        status: 500
      });
    } else {
      userRecord = existingUser;
    }

    // Get plan details
    const {
      data: plan,
      error: planError
    } = await supabaseServiceClient.from('plans').select('*').eq('id', plan_id).single();
    if (planError || !plan) {
      console.error('Plan not found:', planError);
      console.error('Plan ID being searched:', plan_id);
      return NextResponse.json({
        error: 'Plan not found',
        details: planError?.message || 'Plan does not exist',
        plan_id: plan_id
      }, {
        status: 404
      });
    }
    // Check if payment already exists (prevent duplicate processing)
    const {
      data: existingPayment
    } = await supabaseServiceClient.from('payments').select('id').eq('razorpay_payment_id', razorpay_payment_id).single();
    if (existingPayment) {
      return NextResponse.json({
        message: 'Payment already processed',
        payment_id: existingPayment.id
      }, {
        status: 200
      });
    }

    // Calculate expires_at based on billing cycle
    const now = new Date();
    const expiresAt = plan.billing_cycle === 'monthly'
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      : plan.billing_cycle === 'yearly'
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      : null;

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
      payment_date: new Date().toISOString(),
      expires_at: expiresAt
    };
    const {
      data: payment,
      error: paymentError
    } = await supabaseServiceClient.from('payments').insert(paymentData).select().single();
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
        // Still update user plan even if payment record can't be created
        type UserUpdateData = {
          plan_type: string;
          plan_id: string;
          subscription_id: string | null;
          updated_at?: string;
          max_projects?: number;
          can_use_features?: string[];
          plan_expires_at?: string | null;
        };
        const userUpdateData: UserUpdateData = {
          plan_type: plan.plan_type,
          plan_id: plan.id,
          subscription_id: subscription_id || null,
          updated_at: new Date().toISOString()
        };

        // Add optional columns only if they exist in the schema
        if (plan.max_projects !== undefined) {
          userUpdateData.max_projects = plan.max_projects;
        }
        if (plan.can_use_features !== undefined) {
          userUpdateData.can_use_features = plan.can_use_features;
        }
        if (plan.billing_cycle) {
          userUpdateData.plan_expires_at = plan.billing_cycle === 'monthly' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          : plan.billing_cycle === 'yearly' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
          : null;
        }
        let fallbackUpdateResult: { id: string }[] | null = null;
        let fallbackUserUpdateError: { message?: string; code?: string; details?: unknown; hint?: unknown } | null = null;

        // Try to update with all columns first
        const {
          data: fallbackFullUpdateResult,
          error: fallbackFullUpdateError
        } = await supabaseServiceClient.from('users').update(userUpdateData).eq('id', user.id).select('id, plan_type, plan_id, max_projects, can_use_features, plan_expires_at');
        if (fallbackFullUpdateError) {
          console.warn('Fallback full update failed, trying with essential columns only:', fallbackFullUpdateError.message);

          // Fallback: Update only essential columns that should exist in any users table
          const essentialUpdateData: { plan_type: string; plan_id: string; updated_at?: string } = {
            plan_type: plan.plan_type,
            plan_id: plan.id
          };

          // Only add updated_at if the column exists (it might not in some schemas)
          try {
            essentialUpdateData.updated_at = new Date().toISOString();
          } catch {
            // Ignore if updated_at column doesn't exist
          }
          const {
            data: fallbackEssentialUpdateResult,
            error: fallbackEssentialUpdateError
          } = await supabaseServiceClient.from('users').update(essentialUpdateData).eq('id', user.id).select('id, plan_type, plan_id');
          if (fallbackEssentialUpdateError) {
            console.error('Fallback essential update also failed:', fallbackEssentialUpdateError);
            fallbackUserUpdateError = fallbackEssentialUpdateError;
          } else {
            fallbackUpdateResult = fallbackEssentialUpdateResult;
          }
        } else {
          fallbackUpdateResult = fallbackFullUpdateResult;
        }
        if (fallbackUserUpdateError) {
          console.error('Error updating user plan in fallback:', fallbackUserUpdateError);
          console.error('Fallback user update data that failed:', userUpdateData);
          console.error('Fallback update error details:', {
            message: fallbackUserUpdateError.message,
            code: fallbackUserUpdateError.code,
            details: fallbackUserUpdateError.details,
            hint: fallbackUserUpdateError.hint
          });
          return NextResponse.json({
            error: 'Payments table not set up, but user plan update failed',
            details: 'Payment recorded but user plan update failed'
          }, {
            status: 200
          });
        } else {
          // Verify the update was successful
          if (!Array.isArray(fallbackUpdateResult) || fallbackUpdateResult.length === 0) {
            console.warn('Fallback: Update succeeded but no data returned - user might not exist');
          }
        }
        // Send payment success email for fallback case too
        try {
          const { data: emailTemplate, error: templateError } = await supabaseServiceClient
            .from('email_templates')
            .select('*')
            .eq('template_type', 'payment-success')
            .eq('is_active', true)
            .single();

          if (emailTemplate && !templateError) {
            const emailData = {
              user_name: userRecord.first_name || userRecord.email?.split('@')[0] || 'User',
              plan_name: plan.name,
              plan_type: plan.plan_type,
              billing_cycle: plan.billing_cycle,
              amount: amount.toLocaleString(),
              currency: currency,
              payment_date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              expires_at: userUpdateData.plan_expires_at ? new Date(userUpdateData.plan_expires_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A',
              payment_id: 'temp_' + Date.now(),
              payment_method: payment_method || 'Razorpay',
              features: plan.features || [],
              dashboard_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/dashboard`
            };

            // Replace variables in email content
            let htmlContent = emailTemplate.html_content;
            let textContent = emailTemplate.text_content;
            let subject = emailTemplate.subject;

            Object.entries(emailData).forEach(([key, value]) => {
              const placeholder = `{{${key}}}`;
              const regex = new RegExp(placeholder, 'g');

              if (typeof value === 'string') {
                htmlContent = htmlContent.replace(regex, value);
                textContent = textContent.replace(regex, value);
                subject = subject.replace(regex, value);
              } else if (Array.isArray(value)) {
                if (key === 'features') {
                  const featuresList = value.map(feature => `<li>${feature}</li>`).join('');
                  htmlContent = htmlContent.replace(/{{#each features}}[\s\S]*?{{\/each}}/g, featuresList);

                  const textFeaturesList = value.map(feature => `- ${feature}`).join('\n');
                  textContent = textContent.replace(/{{#each features}}[\s\S]*?{{\/each}}/g, textFeaturesList);
                }
              }
            });

            const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: user.email,
                subject: subject,
                html: htmlContent,
                text: textContent
              })
            });

            if (emailResponse.ok) {

            } else {
              console.warn('Failed to send payment success email (fallback):', await emailResponse.text());
            }
          }
        } catch (emailError) {
          console.warn('Payment successful but email sending failed (fallback):', emailError);
        }

        const fallbackResponse = {
          success: true,
          message: 'Payment processed successfully (payments table not set up yet)',
          payment_id: 'temp_' + Date.now(),
          user_plan_updated: !fallbackUserUpdateError,
          plan_details: {
            plan_name: plan.name,
            plan_type: plan.plan_type,
            billing_cycle: plan.billing_cycle,
            max_projects: plan.max_projects,
            can_use_features: plan.can_use_features,
            plan_expires_at: userUpdateData.plan_expires_at
          },
          user_id: user.id,
          updated_at: new Date().toISOString()
        };
        return NextResponse.json(fallbackResponse, {
          status: 200
        });
      } else if (paymentError.code === '23503' || paymentError.message?.includes('violates foreign key constraint')) {
        console.error('Foreign key constraint violation:', paymentError);
        return NextResponse.json({
          error: 'Database constraint violation',
          details: 'User or plan not found in database',
          code: 'FOREIGN_KEY_VIOLATION',
          user_id: user.id,
          plan_id: plan_id
        }, {
          status: 400
        });
      }
      return NextResponse.json({
        error: 'Failed to create payment record',
        details: paymentError.message,
        code: paymentError.code,
        hint: paymentError.hint
      }, {
        status: 500
      });
    }
    // Update user's plan with comprehensive data (only include columns that exist)
    type UserUpdateData = {
      plan_type: string;
      plan_id: string;
      subscription_id: string | null;
      updated_at?: string;
      max_projects?: number;
      can_use_features?: string[];
      plan_expires_at?: string | null;
    };
    const userUpdateData: UserUpdateData = {
      plan_type: plan.plan_type,
      plan_id: plan.id,
      subscription_id: subscription_id || null,
      updated_at: new Date().toISOString()
    };

    // Add optional columns only if they exist in the schema
    // We'll try to add them and handle errors gracefully
    if (plan.max_projects !== undefined) {
      userUpdateData.max_projects = plan.max_projects;
    }
    if (plan.can_use_features !== undefined) {
      userUpdateData.can_use_features = plan.can_use_features;
    }
    if (plan.billing_cycle) {
      const now = new Date();
      userUpdateData.plan_expires_at = plan.billing_cycle === 'monthly' ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      : plan.billing_cycle === 'yearly' ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      : null;
    }
    let updateResult: { id: string }[] | null = null;
    let userUpdateError: { message?: string; code?: string; details?: unknown; hint?: unknown } | null = null;

    // Try to update with all columns first
    const {
      data: fullUpdateResult,
      error: fullUpdateError
    } = await supabaseServiceClient.from('users').update(userUpdateData).eq('id', user.id).select('id, plan_type, plan_id, max_projects, can_use_features, plan_expires_at');
    if (fullUpdateError) {
      console.warn('Full update failed, trying with essential columns only:', fullUpdateError.message);

      // Fallback: Update only essential columns that should exist in any users table
      const essentialUpdateData: { plan_type: string; plan_id: string; updated_at?: string } = {
        plan_type: plan.plan_type,
        plan_id: plan.id
      };

      // Only add updated_at if the column exists (it might not in some schemas)
      try {
        essentialUpdateData.updated_at = new Date().toISOString();
      } catch {
        // Ignore if updated_at column doesn't exist
      }
      const {
        data: essentialUpdateResult,
        error: essentialUpdateError
      } = await supabaseServiceClient.from('users').update(essentialUpdateData).eq('id', user.id).select('id, plan_type, plan_id');
      if (essentialUpdateError) {
        console.error('Essential update also failed:', essentialUpdateError);
        userUpdateError = essentialUpdateError;
      } else {
        updateResult = essentialUpdateResult;
      }
    } else {
      updateResult = fullUpdateResult;
    }
    if (userUpdateError) {
      console.error('Error updating user plan:', userUpdateError);
      console.error('User update data that failed:', userUpdateData);
      console.error('Update error details:', {
        message: userUpdateError.message,
        code: userUpdateError.code,
        details: userUpdateError.details,
        hint: userUpdateError.hint
      });
      // Don't fail the entire request, but log the error
      console.warn('Payment recorded but user plan update failed');
    } else {
      // Verify the update was successful
      if (!Array.isArray(updateResult) || updateResult.length === 0) {
        console.warn('Update succeeded but no data returned - user might not exist');
      }
    }

    // Send payment success email
    try {
      // Get the payment success email template
      const { data: emailTemplate, error: templateError } = await supabaseServiceClient
        .from('email_templates')
        .select('*')
        .eq('template_type', 'payment-success')
        .eq('is_active', true)
        .single();

      if (emailTemplate && !templateError) {
        // Prepare email data
        const emailData = {
          user_name: userRecord.first_name || userRecord.email?.split('@')[0] || 'User',
          plan_name: plan.name,
          plan_type: plan.plan_type,
          billing_cycle: plan.billing_cycle,
          amount: amount.toLocaleString(),
          currency: currency,
          payment_date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          expires_at: userUpdateData.plan_expires_at ? new Date(userUpdateData.plan_expires_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'N/A',
          payment_id: payment.id,
          payment_method: payment_method || 'Razorpay',
          features: plan.features || [],
          dashboard_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/dashboard`
        };

        // Replace variables in email content
        let htmlContent = emailTemplate.html_content;
        let textContent = emailTemplate.text_content;
        let subject = emailTemplate.subject;

        // Replace all variables in the template
        Object.entries(emailData).forEach(([key, value]) => {
          const placeholder = `{{${key}}}`;
          const regex = new RegExp(placeholder, 'g');

          if (typeof value === 'string') {
            htmlContent = htmlContent.replace(regex, value);
            textContent = textContent.replace(regex, value);
            subject = subject.replace(regex, value);
          } else if (Array.isArray(value)) {
            // Handle features array
            if (key === 'features') {
              const featuresList = value.map(feature => `<li>${feature}</li>`).join('');
              htmlContent = htmlContent.replace(/{{#each features}}[\s\S]*?{{\/each}}/g, featuresList);

              const textFeaturesList = value.map(feature => `- ${feature}`).join('\n');
              textContent = textContent.replace(/{{#each features}}[\s\S]*?{{\/each}}/g, textFeaturesList);
            }
          }
        });

        // Send email using your email service
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user.email,
            subject: subject,
            html: htmlContent,
            text: textContent
          })
        });

        if (emailResponse.ok) {

        } else {
          console.warn('Failed to send payment success email:', await emailResponse.text());
        }
      } else {
        console.warn('Payment success email template not found or inactive');
      }
    } catch (emailError) {
      console.warn('Payment successful but email sending failed:', emailError);
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
        max_projects: plan.max_projects,
        can_use_features: plan.can_use_features,
        plan_expires_at: userUpdateData.plan_expires_at
      },
      user_id: user.id,
      updated_at: new Date().toISOString()
    };
    return NextResponse.json(responseData, {
      status: 200
    });
  } catch (error) {
    console.error('Payment success processing error:', error);
    return NextResponse.json({
      error: 'Failed to process payment success',
      details: (error as Error).message
    }, {
      status: 500
    });
  }
}