import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify the requesting user is an admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const {
      data: { user: requestingUser },
      error: authError
    } = await supabase.auth.getUser(token);

    if (authError || !requestingUser) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if requesting user is admin
    const { data: adminCheck, error: adminError } = await supabaseServiceClient
      .from('users')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if (adminError || !adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch auth user data using service role
    const { data: authUser, error: authUserError } = await supabaseServiceClient.auth.admin.getUserById(userId);

    if (authUserError) {
      console.error('Error fetching auth user:', authUserError);
      return NextResponse.json(
        { error: 'Failed to fetch auth user data' },
        { status: 500 }
      );
    }

    if (!authUser || !authUser.user) {
      return NextResponse.json(
        { error: 'User not found in auth' },
        { status: 404 }
      );
    }

    // Return relevant auth metadata
    return NextResponse.json({
      raw_user_meta_data: authUser.user.user_metadata || {},
      app_metadata: authUser.user.app_metadata || {},
      providers: authUser.user.app_metadata?.providers || [],
      last_sign_in_at: authUser.user.last_sign_in_at,
      email_confirmed_at: authUser.user.email_confirmed_at,
    });
  } catch (error) {
    console.error('Error in user-auth-data GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

