import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// GET /api/plans/[id] - Fetch a specific plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching plan:', error);
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan });

  } catch (error) {
    console.error('Unexpected error fetching plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/plans/[id] - Update a plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate plan_type if provided
    if (body.plan_type && !['Starter', 'Growth', 'Scale'].includes(body.plan_type)) {
      return NextResponse.json(
        { error: 'Invalid plan_type. Must be Starter, Growth, or Scale' },
        { status: 400 }
      );
    }

    // Filter out empty razorpay_plan_id to avoid unique constraint violations
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    // Remove razorpay_plan_id if it's empty to avoid unique constraint issues
    if (updateData.razorpay_plan_id === '' || updateData.razorpay_plan_id === null) {
      delete updateData.razorpay_plan_id;
    }

    const { data, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', id)
      .select();

    // Check if any rows were affected
    if (!data || data.length === 0) {
      console.error('No rows affected for plan ID:', id);
      console.error('Update data:', updateData);
      return NextResponse.json(
        { error: `Plan not found with ID: ${id}` },
        { status: 404 }
      );
    }

    // Return the first (and should be only) updated plan
    const updatedPlan = data[0];

    if (error) {
      console.error('Error updating plan:', error);
      const supabaseError = error as SupabaseError;
      console.error('Error details:', {
        message: supabaseError.message,
        code: supabaseError.code,
        details: supabaseError.details,
        hint: supabaseError.hint
      });
      
      // Handle specific error cases
      if (supabaseError.code === '23505') {
        return NextResponse.json(
          { error: 'A plan with this Razorpay ID already exists. Please use a different Razorpay ID or leave it empty.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to update plan: ${supabaseError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plan: updatedPlan,
      message: 'Plan updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error updating plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/[id] - Delete a plan (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('plans')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    // Check if any rows were affected
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (error) {
      console.error('Error deleting plan:', error);
      return NextResponse.json(
        { error: 'Failed to delete plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Plan deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error deleting plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
