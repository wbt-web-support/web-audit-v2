import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function GET(_request: NextRequest) {
  try {
    // Check environment variables
    const hasKeyId = !!process.env.RAZORPAY_KEY_ID;
    const hasKeySecret = !!process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    
    console.log('Razorpay configuration check:', {
      hasKeyId,
      hasKeySecret,
      keyIdPrefix: keyId ? keyId.substring(0, 10) + '...' : 'Not set'
    });

    if (!hasKeyId || !hasKeySecret) {
      return NextResponse.json({
        error: 'Razorpay keys not configured',
        hasKeyId,
        hasKeySecret
      }, { status: 500 });
    }

    // Try to create Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Test with a minimal order
    const testOrder = await razorpay.orders.create({
      amount: 100, // 1 rupee in paise
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
      notes: {
        source: 'test'
      }
    });

    return NextResponse.json({
      success: true,
      orderId: testOrder.id,
      message: 'Razorpay configuration is working'
    });

  } catch (error) {
    console.error('Razorpay test error:', error);
    return NextResponse.json({
      error: 'Razorpay test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
