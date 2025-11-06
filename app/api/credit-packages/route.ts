import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// GET - Fetch all credit packages
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching credit packages:', error);
      return NextResponse.json({
        error: 'Failed to fetch credit packages',
        details: error.message
      }, {
        status: 500
      });
    }

    return NextResponse.json({
      success: true,
      packages: (data || []).map(pkg => ({
        id: pkg.id,
        credits: pkg.credits,
        price: pkg.price,
        label: pkg.label,
        is_active: pkg.is_active,
        sort_order: pkg.sort_order,
        pricePerCredit: (Number(pkg.price) / pkg.credits).toFixed(2)
      }))
    });
  } catch (error) {
    console.error('Unexpected error in GET credit packages:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}

// POST - Create new credit package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credits, price, label, sort_order } = body;

    // Validation
    if (!credits || credits <= 0) {
      return NextResponse.json({
        error: 'Invalid credits',
        message: 'Credits must be a positive number'
      }, {
        status: 400
      });
    }

    if (!price || price <= 0) {
      return NextResponse.json({
        error: 'Invalid price',
        message: 'Price must be a positive number'
      }, {
        status: 400
      });
    }

    if (!label || label.trim() === '') {
      return NextResponse.json({
        error: 'Invalid label',
        message: 'Label is required'
      }, {
        status: 400
      });
    }

    // Check if credits value already exists
    const { data: existing } = await supabaseAdmin
      .from('credit_packages')
      .select('id')
      .eq('credits', credits)
      .single();

    if (existing) {
      return NextResponse.json({
        error: 'Duplicate credits',
        message: `A package with ${credits} credits already exists`
      }, {
        status: 400
      });
    }

    const packageData = {
      credits: Number(credits),
      price: Number(price),
      label: label.trim(),
      sort_order: sort_order || 0,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('credit_packages')
      .insert([packageData])
      .select()
      .single();

    if (error) {
      console.error('Error creating credit package:', error);
      return NextResponse.json({
        error: 'Failed to create credit package',
        details: error.message
      }, {
        status: 500
      });
    }

    return NextResponse.json({
      success: true,
      package: {
        id: data.id,
        credits: data.credits,
        price: data.price,
        label: data.label,
        is_active: data.is_active,
        sort_order: data.sort_order,
        pricePerCredit: (Number(data.price) / data.credits).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Unexpected error in POST credit packages:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}

