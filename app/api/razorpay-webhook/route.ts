import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils';

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  error_code?: string;
  error_description?: string;
}

interface OrderData {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for webhook signature validation
    const rawBody = await request.text();
    const webhookBody = JSON.parse(rawBody);
    
    // Get the webhook signature from headers
    const webhookSignature = request.headers.get('x-razorpay-signature');
    
    // Get webhook secret from environment variables
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'Test123@';
    
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    if (!webhookSignature) {
      console.error('Missing Razorpay signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }
    
    // Validate the webhook signature
    const isValidSignature = validateWebhookSignature(
      rawBody,
      webhookSignature,
      webhookSecret
    );
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Process the webhook event
    const event = webhookBody.event;
    const paymentData = webhookBody.payload.payment?.entity;
    const orderData = webhookBody.payload.order?.entity;
    
    console.log('Razorpay webhook received:', {
      event,
      paymentId: paymentData?.id,
      orderId: orderData?.id,
      amount: paymentData?.amount,
      status: paymentData?.status
    });
    
    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(paymentData, orderData);
        break;
        
      case 'payment.failed':
        await handlePaymentFailed(paymentData, orderData);
        break;
        
      case 'order.paid':
        await handleOrderPaid(paymentData, orderData);
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
    
    return NextResponse.json({ status: 'success' });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle successful payment capture
async function handlePaymentCaptured(paymentData: PaymentData, orderData: OrderData) {
  try {
    console.log('Payment captured:', {
      paymentId: paymentData.id,
      orderId: orderData.id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      method: paymentData.method
    });
    
    // TODO: Update your database with successful payment
    // Example: Update user subscription, send confirmation email, etc.
    
    // You can add your business logic here:
    // - Update user subscription status
    // - Send confirmation email
    // - Update order status in database
    // - Trigger any post-payment workflows
    
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentData: PaymentData, orderData: OrderData) {
  try {
    console.log('Payment failed:', {
      paymentId: paymentData.id,
      orderId: orderData.id,
      errorCode: paymentData.error_code,
      errorDescription: paymentData.error_description
    });
    
    // TODO: Handle failed payment
    // Example: Update order status, send failure notification, etc.
    
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Handle order paid event
async function handleOrderPaid(paymentData: PaymentData, orderData: OrderData) {
  try {
    console.log('Order paid:', {
      paymentId: paymentData.id,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency
    });
    
    // TODO: Handle order completion
    // Example: Fulfill order, send receipt, etc.
    
  } catch (error) {
    console.error('Error handling order paid:', error);
  }
}
