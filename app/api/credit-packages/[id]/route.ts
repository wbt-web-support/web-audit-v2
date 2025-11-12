import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// PUT - Update credit package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { credits, price, label, is_active, sort_order } = body;

    // Validation
    if (credits !== undefined && (credits <= 0 || !Number.isInteger(credits))) {
      return NextResponse.json({
        error: 'Invalid credits',
        message: 'Credits must be a positive integer'
      }, {
        status: 400
      });
    }

    if (price !== undefined && price <= 0) {
      return NextResponse.json({
        error: 'Invalid price',
        message: 'Price must be a positive number'
      }, {
        status: 400
      });
    }

    if (label !== undefined && label.trim() === '') {
      return NextResponse.json({
        error: 'Invalid label',
        message: 'Label cannot be empty'
      }, {
        status: 400
      });
    }

    // If credits are being changed, check for duplicates
    if (credits !== undefined) {
      const { data: existing } = await supabaseAdmin
        .from('credit_packages')
        .select('id')
        .eq('credits', credits)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json({
          error: 'Duplicate credits',
          message: `A package with ${credits} credits already exists`
        }, {
          status: 400
        });
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (credits !== undefined) updateData.credits = Number(credits);
    if (price !== undefined) updateData.price = Number(price);
    if (label !== undefined) updateData.label = label.trim();
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (sort_order !== undefined) updateData.sort_order = Number(sort_order);

    const { data, error } = await supabaseAdmin
      .from('credit_packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating credit package:', error);
      return NextResponse.json({
        error: 'Failed to update credit package',
        details: error.message
      }, {
        status: 500
      });
    }

    if (!data) {
      return NextResponse.json({
        error: 'Package not found',
        message: 'Credit package with the given ID does not exist'
      }, {
        status: 404
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
    console.error('Unexpected error in PUT credit package:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}

// DELETE - Soft delete credit package (set is_active to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('credit_packages')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting credit package:', error);
      return NextResponse.json({
        error: 'Failed to delete credit package',
        details: error.message
      }, {
        status: 500
      });
    }

    if (!data) {
      return NextResponse.json({
        error: 'Package not found',
        message: 'Credit package with the given ID does not exist'
      }, {
        status: 404
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Credit package deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error in DELETE credit package:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}

