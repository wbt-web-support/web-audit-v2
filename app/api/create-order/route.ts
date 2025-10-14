import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabase';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});
export async function POST(request: NextRequest) {
  try {
    // Check Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys not configured');
      return NextResponse.json({
        error: 'Razorpay keys not configured',
        details: 'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.'
      }, {
        status: 500
      });
    }
    const {
      amount,
      currency = 'INR',
      receipt,
      plan_id
    } = await request.json();
    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({
        error: 'Valid amount is required'
      }, {
        status: 400
      });
    }

    // Validate receipt length
    if (receipt && receipt.length > 40) {
      console.warn('Receipt too long, will be truncated:', receipt);
    }

    // Create regular order (supports all payment methods)
    // Ensure receipt is max 40 characters
    const receiptId = receipt || `rec_${Date.now()}`;
    const finalReceipt = receiptId.length > 40 ? receiptId.substring(0, 40) : receiptId;
    const options = {
      amount: Math.round(amount),
      // Ensure amount is an integer
      currency: currency,
      receipt: finalReceipt,
      notes: {
        source: 'web_audit_pricing',
        plan_id: plan_id || 'direct_payment',
        payment_type: 'one_time_payment'
      }
    };
    const order = await razorpay.orders.create(options);
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);

    // Handle Razorpay-specific errors
    const err = error as any;
    const statusCode = typeof err?.statusCode === 'number' ? err.statusCode : 500;
    const description = err?.error?.description || err?.message || err?.error || 'Unknown error';
    const raw = err?.response?.body || err?.response || undefined;
    console.error('Razorpay error details:', {
      statusCode,
      message: err?.message,
      description,
      razorpay_error: err?.error,
      raw
    });
    return NextResponse.json({
      error: 'Failed to create order',
      details: description,
      razorpay_error: err?.error,
      raw
    }, {
      status: statusCode
    });
  }
}