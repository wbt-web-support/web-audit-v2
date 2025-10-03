import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/plans/[id] - Fetch a specific plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', params.id)
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate plan_type if provided
    if (body.plan_type && !['free', 'pro', 'enterprise'].includes(body.plan_type)) {
      return NextResponse.json(
        { error: 'Invalid plan_type. Must be free, pro, or enterprise' },
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
      .eq('id', params.id)
      .select();

    // Check if any rows were affected
    if (!data || data.length === 0) {
      console.error('No rows affected for plan ID:', params.id);
      console.error('Update data:', updateData);
      return NextResponse.json(
        { error: `Plan not found with ID: ${params.id}` },
        { status: 404 }
      );
    }

    // Return the first (and should be only) updated plan
    const updatedPlan = data[0];

    if (error) {
      console.error('Error updating plan:', error);
      console.error('Error details:', {
        message: (error as any).message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint
      });
      
      // Handle specific error cases
      if ((error as any).code === '23505') {
        return NextResponse.json(
          { error: 'A plan with this Razorpay ID already exists. Please use a different Razorpay ID or leave it empty.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to update plan: ${(error as any).message || 'Unknown error'}` },
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
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('plans')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
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
