import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase';
import Razorpay from 'razorpay';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

// Helper function to fetch credit packages from database
async function getCreditPackages() {
  try {
    const { data, error } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching credit packages:', error);
      // Fallback to default packages if database fetch fails
      return [
        { credits: 10, price: 100, label: '10 Credits' },
        { credits: 25, price: 200, label: '25 Credits' },
        { credits: 50, price: 350, label: '50 Credits' },
        { credits: 100, price: 600, label: '100 Credits' },
        { credits: 250, price: 1200, label: '250 Credits' },
        { credits: 500, price: 2000, label: '500 Credits' }
      ];
    }

    if (!data || data.length === 0) {
      // Fallback to default packages if no packages found
      return [
        { credits: 10, price: 100, label: '10 Credits' },
        { credits: 25, price: 200, label: '25 Credits' },
        { credits: 50, price: 350, label: '50 Credits' },
        { credits: 100, price: 600, label: '100 Credits' },
        { credits: 250, price: 1200, label: '250 Credits' },
        { credits: 500, price: 2000, label: '500 Credits' }
      ];
    }

    return data.map((pkg: any) => ({
      id: pkg.id,
      credits: pkg.credits,
      price: Number(pkg.price),
      label: pkg.label
    }));
  } catch (error) {
    console.error('Error in getCreditPackages:', error);
    // Fallback to default packages
    return [
      { credits: 10, price: 100, label: '10 Credits' },
      { credits: 25, price: 200, label: '25 Credits' },
      { credits: 50, price: 350, label: '50 Credits' },
      { credits: 100, price: 600, label: '100 Credits' },
      { credits: 250, price: 1200, label: '250 Credits' },
      { credits: 500, price: 2000, label: '500 Credits' }
    ];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credits, packageId } = body;

    // Get user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authentication required',
        code: 'MISSING_AUTH'
      }, {
        status: 401
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({
        error: 'Invalid authentication token',
        code: 'INVALID_AUTH',
        details: authError?.message || 'Token verification failed'
      }, {
        status: 401
      });
    }

    // Fetch credit packages from database
    const CREDIT_PACKAGES = await getCreditPackages();
    
    // Determine credit package
    let creditPackage;
    if (packageId !== undefined) {
      // Use package ID if provided (can be UUID or index)
      if (packageId.includes('-')) {
        // UUID format
        creditPackage = CREDIT_PACKAGES.find((pkg: any) => pkg.id === packageId);
      } else {
        // Index format (for backward compatibility)
        creditPackage = CREDIT_PACKAGES[Number(packageId)];
      }
    } else if (credits) {
      // Find package by credits amount
      creditPackage = CREDIT_PACKAGES.find((pkg: any) => pkg.credits === credits);
    }

    if (!creditPackage) {
      return NextResponse.json({
        error: 'Invalid credit package',
        code: 'INVALID_PACKAGE',
        message: 'Please select a valid credit package',
        availablePackages: CREDIT_PACKAGES.map((pkg: any, idx: number) => ({
          id: pkg.id || idx,
          credits: pkg.credits,
          price: pkg.price,
          label: pkg.label
        }))
      }, {
        status: 400
      });
    }

    // Check Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys not configured');
      return NextResponse.json({
        error: 'Payment system not configured',
        code: 'PAYMENT_NOT_CONFIGURED',
        message: 'Payment system is not available at this time'
      }, {
        status: 500
      });
    }

    // Create Razorpay order
    const receiptId = `credits_${user.id}_${Date.now()}`;
    const options = {
      amount: Math.round(creditPackage.price * 100), // Convert to paise
      currency: 'INR',
      receipt: receiptId.substring(0, 40), // Max 40 chars
      notes: {
        source: 'web_audit_credits',
        user_id: user.id,
        credits: creditPackage.credits.toString(),
        payment_type: 'credit_purchase'
      }
    };

    try {
      const order = await razorpay.orders.create(options);
      
      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        credits: creditPackage.credits,
        price: creditPackage.price,
        packageId: ('id' in creditPackage ? creditPackage.id : undefined) || packageId
      });
    } catch (razorpayError: any) {
      console.error('Error creating Razorpay order:', razorpayError);
      return NextResponse.json({
        error: 'Failed to create payment order',
        code: 'ORDER_CREATION_FAILED',
        message: razorpayError?.message || 'Unable to process payment request'
      }, {
        status: 500
      });
    }
  } catch (error) {
    console.error('❌ Error in purchase-credits API route:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'INTERNAL_ERROR'
    }, {
      status: 500
    });
  }
}

// GET endpoint to retrieve available credit packages
export async function GET() {
  try {
    const CREDIT_PACKAGES = await getCreditPackages();
    
    return NextResponse.json({
      success: true,
      packages: CREDIT_PACKAGES.map((pkg: any) => ({
        id: pkg.id,
        credits: pkg.credits,
        price: pkg.price,
        label: pkg.label,
        pricePerCredit: (pkg.price / pkg.credits).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Error in GET credit packages:', error);
    return NextResponse.json({
      error: 'Failed to fetch credit packages',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}

