
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCORS, errorResponse, successResponse, getValidToken } from "../_shared/utils.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS
  const corsResponse = await handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }
    
    // Get JWT user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return errorResponse('Invalid token or user not found', 401);
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop() || '';
    
    // Parse request body if it exists
    let requestBody = {};
    if (req.method !== 'GET' && req.headers.get('content-type')?.includes('application/json')) {
      requestBody = await req.json();
    }
    
    // Get provider from query or body
    const provider = url.searchParams.get('provider') || (requestBody as any).provider || 'zomato';
    
    // Get valid provider token (except for restaurant search which doesn't require auth)
    let tokenData = null;
    if (path !== 'search-restaurants') {
      tokenData = await getValidToken(supabaseClient, user.id, provider);
      if (!tokenData) {
        return errorResponse(`${provider} not connected`, 400);
      }
    }
    
    // Handle different API endpoints
    switch (path) {
      case 'search-restaurants':
        return await searchRestaurants(user.id, provider, supabaseClient, url.searchParams);
        
      case 'get-menu':
        return await getRestaurantMenu(user.id, provider, tokenData?.accessToken, supabaseClient, url.searchParams);
        
      case 'place-order':
        return await placeOrder(user.id, provider, tokenData?.accessToken, supabaseClient, requestBody);
        
      case 'order-status':
        return await getOrderStatus(user.id, provider, tokenData?.accessToken, supabaseClient, url.searchParams);
        
      case 'order-history':
        return await getOrderHistory(user.id, supabaseClient);
        
      default:
        return errorResponse('Invalid endpoint', 404);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return errorResponse(`Internal server error: ${error.message}`, 500);
  }
});

async function searchRestaurants(userId: string, provider: string, supabaseClient: any, params: URLSearchParams) {
  try {
    const query = params.get('query') || '';
    const latitude = params.get('latitude') || '';
    const longitude = params.get('longitude') || '';
    
    if (!latitude || !longitude) {
      return errorResponse('Location coordinates are required');
    }
    
    // This is a simulation as we don't have actual API access
    // In a real implementation, you would call the respective food delivery service APIs
    
    // Simulate restaurant search
    const restaurants = [
      {
        id: 'rest-001',
        name: 'Tasty Bites',
        cuisine: 'Indian',
        rating: 4.5,
        delivery_time: '30-40 min',
        price_range: '₹₹',
        image_url: 'https://via.placeholder.com/150',
      },
      {
        id: 'rest-002',
        name: 'Pizza Paradise',
        cuisine: 'Italian',
        rating: 4.2,
        delivery_time: '25-35 min',
        price_range: '₹₹₹',
        image_url: 'https://via.placeholder.com/150',
      },
      {
        id: 'rest-003',
        name: 'Sushi Express',
        cuisine: 'Japanese',
        rating: 4.7,
        delivery_time: '40-50 min',
        price_range: '₹₹₹₹',
        image_url: 'https://via.placeholder.com/150',
      },
      {
        id: 'rest-004',
        name: 'Burger Barn',
        cuisine: 'American',
        rating: 4.0,
        delivery_time: '20-30 min',
        price_range: '₹₹',
        image_url: 'https://via.placeholder.com/150',
      },
      {
        id: 'rest-005',
        name: 'Chinese Dragon',
        cuisine: 'Chinese',
        rating: 3.9,
        delivery_time: '35-45 min',
        price_range: '₹₹',
        image_url: 'https://via.placeholder.com/150',
      }
    ];
    
    // Filter by query if provided
    let filtered = restaurants;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = restaurants.filter(
        r => r.name.toLowerCase().includes(lowerQuery) || r.cuisine.toLowerCase().includes(lowerQuery)
      );
    }
    
    return successResponse({
      provider,
      restaurants: filtered
    });
  } catch (error) {
    console.error("Error searching restaurants:", error);
    return errorResponse(`Failed to search restaurants: ${error.message}`);
  }
}

async function getRestaurantMenu(userId: string, provider: string, accessToken: string, supabaseClient: any, params: URLSearchParams) {
  try {
    const restaurantId = params.get('restaurant_id');
    
    if (!restaurantId) {
      return errorResponse('Restaurant ID is required');
    }
    
    // Simulate restaurant menu
    const menuItems = [
      {
        id: 'item-001',
        name: 'Butter Chicken',
        description: 'Creamy tomato sauce with tender chicken pieces',
        price: 280,
        image_url: 'https://via.placeholder.com/100',
        category: 'Main Course',
        veg: false,
      },
      {
        id: 'item-002',
        name: 'Paneer Tikka',
        description: 'Grilled cottage cheese with spices',
        price: 220,
        image_url: 'https://via.placeholder.com/100',
        category: 'Starters',
        veg: true,
      },
      {
        id: 'item-003',
        name: 'Naan',
        description: 'Leavened flatbread',
        price: 40,
        image_url: 'https://via.placeholder.com/100',
        category: 'Bread',
        veg: true,
      },
      {
        id: 'item-004',
        name: 'Dal Makhani',
        description: 'Black lentils cooked with butter and cream',
        price: 180,
        image_url: 'https://via.placeholder.com/100',
        category: 'Main Course',
        veg: true,
      },
      {
        id: 'item-005',
        name: 'Gulab Jamun',
        description: 'Sweet dumplings soaked in sugar syrup',
        price: 100,
        image_url: 'https://via.placeholder.com/100',
        category: 'Dessert',
        veg: true,
      }
    ];
    
    const restaurant = {
      id: restaurantId,
      name: 'Tasty Bites',
      cuisine: 'Indian',
      rating: 4.5,
      delivery_time: '30-40 min',
      price_range: '₹₹',
      image_url: 'https://via.placeholder.com/150',
    };
    
    return successResponse({
      provider,
      restaurant,
      menu_items: menuItems
    });
  } catch (error) {
    console.error("Error getting restaurant menu:", error);
    return errorResponse(`Failed to get restaurant menu: ${error.message}`);
  }
}

async function placeOrder(userId: string, provider: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { restaurant_name, delivery_address, order_items } = requestBody;
    
    if (!restaurant_name || !delivery_address || !order_items || !order_items.length) {
      return errorResponse('Restaurant name, delivery address, and order items are required');
    }
    
    // Calculate order total
    let orderTotal = 0;
    for (const item of order_items) {
      orderTotal += (item.price * item.quantity);
    }
    
    // Generate order ID
    const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Store order in database
    const { data: order, error } = await supabaseClient.from('food_orders').insert({
      user_id: userId,
      provider,
      restaurant_name,
      delivery_address,
      order_items,
      order_total: orderTotal,
      order_id: orderId,
      status: 'placed'
    }).select().single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return successResponse(order);
  } catch (error) {
    console.error("Error placing order:", error);
    return errorResponse(`Failed to place order: ${error.message}`);
  }
}

async function getOrderStatus(userId: string, provider: string, accessToken: string, supabaseClient: any, params: URLSearchParams) {
  try {
    const orderId = params.get('order_id');
    
    if (!orderId) {
      return errorResponse('Order ID is required');
    }
    
    // Get order from database
    const { data: order, error } = await supabaseClient
      .from('food_orders')
      .select('*')
      .eq('user_id', userId)
      .eq('order_id', orderId)
      .single();
    
    if (error || !order) {
      return errorResponse('Order not found');
    }
    
    // Simulate status update based on time since order
    const orderTime = new Date(order.created_at).getTime();
    const now = new Date().getTime();
    const timeDiff = (now - orderTime) / 1000 / 60; // minutes
    
    let status = order.status;
    if (timeDiff > 45) {
      status = 'delivered';
    } else if (timeDiff > 30) {
      status = 'out_for_delivery';
    } else if (timeDiff > 15) {
      status = 'preparing';
    } else if (timeDiff > 5) {
      status = 'confirmed';
    }
    
    // Update status in database if changed
    if (status !== order.status) {
      await supabaseClient
        .from('food_orders')
        .update({ status, updated_at: new Date() })
        .eq('id', order.id);
        
      order.status = status;
    }
    
    // Add delivery person info if out for delivery
    if (status === 'out_for_delivery') {
      order.delivery_person = {
        name: "Sarah Delivery",
        phone: "+91XXXXXXXXXX",
        estimated_arrival: "10 minutes"
      };
    }
    
    return successResponse(order);
  } catch (error) {
    console.error("Error getting order status:", error);
    return errorResponse(`Failed to get order status: ${error.message}`);
  }
}

async function getOrderHistory(userId: string, supabaseClient: any) {
  try {
    // Get order history from database
    const { data: orders, error } = await supabaseClient
      .from('food_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return successResponse(orders || []);
  } catch (error) {
    console.error("Error getting order history:", error);
    return errorResponse(`Failed to get order history: ${error.message}`);
  }
}
