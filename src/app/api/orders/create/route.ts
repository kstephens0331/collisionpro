import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      supplierId,
      parts, // Array of { partId, partPriceId, quantity, productUrl }
      customerName,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleVin,
      estimateId,
      notes,
    } = body;

    // Get user from session
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken.value);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    // Get user's shop
    const { data: userData } = await supabaseAdmin
      .from('User')
      .select('shopId')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const shopId = userData.shopId;

    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabaseAdmin
      .rpc('generate_order_number');

    const orderNumber = orderNumberData || `PO-${Date.now()}`;

    // Create purchase order
    const purchaseOrderId = `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error: poError } = await supabaseAdmin
      .from('PurchaseOrder')
      .insert({
        id: purchaseOrderId,
        orderNumber,
        shopId,
        supplierId,
        estimateId: estimateId || null,
        customerName: customerName || null,
        vehicleMake: vehicleMake || null,
        vehicleModel: vehicleModel || null,
        vehicleYear: vehicleYear || null,
        vehicleVin: vehicleVin || null,
        status: 'pending',
        notes: notes || null,
        createdBy: user.id,
      });

    if (poError) {
      console.error('PO creation error:', poError);
      return NextResponse.json(
        { error: 'Failed to create purchase order', details: poError.message },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = await Promise.all(
      parts.map(async (part: any) => {
        // Get part and price details
        const { data: partData } = await supabaseAdmin
          .from('Part')
          .select('partNumber, name')
          .eq('id', part.partId)
          .single();

        const { data: priceData } = await supabaseAdmin
          .from('PartPrice')
          .select('price, productUrl')
          .eq('id', part.partPriceId)
          .single();

        const unitPrice = priceData?.price || 0;
        const totalPrice = unitPrice * part.quantity;

        return {
          id: `oi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          purchaseOrderId,
          partId: part.partId,
          partPriceId: part.partPriceId,
          partNumber: partData?.partNumber || '',
          partName: partData?.name || '',
          quantity: part.quantity,
          unitPrice,
          totalPrice,
          productUrl: part.productUrl || priceData?.productUrl || '',
        };
      })
    );

    const { error: itemsError } = await supabaseAdmin
      .from('OrderItem')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      // Rollback - delete the PO
      await supabaseAdmin.from('PurchaseOrder').delete().eq('id', purchaseOrderId);
      return NextResponse.json(
        { error: 'Failed to create order items', details: itemsError.message },
        { status: 500 }
      );
    }

    // Create initial status history
    await supabaseAdmin
      .from('OrderStatusHistory')
      .insert({
        id: `osh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        purchaseOrderId,
        status: 'pending',
        notes: 'Order created',
        changedBy: user.id,
      });

    // Get the complete order with items
    const { data: completeOrder } = await supabaseAdmin
      .from('PurchaseOrder')
      .select(`
        *,
        supplier:PartSupplier(*),
        items:OrderItem(*),
        createdByUser:User!createdBy(firstName, lastName, email)
      `)
      .eq('id', purchaseOrderId)
      .single();

    return NextResponse.json({
      success: true,
      order: completeOrder,
      message: 'Purchase order created successfully',
    });

  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
