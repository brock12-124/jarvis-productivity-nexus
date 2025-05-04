
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
    const provider = url.searchParams.get('provider') || (requestBody as any).provider || 'uber';
    
    // Get valid provider token
    const tokenData = await getValidToken(supabaseClient, user.id, provider);
    if (!tokenData) {
      return errorResponse(`${provider} not connected`, 400);
    }
    
    // Handle different API endpoints
    switch (path) {
      case 'estimate':
        return await getRideEstimate(user.id, provider, tokenData.accessToken, supabaseClient, requestBody);
        
      case 'book':
        return await bookRide(user.id, provider, tokenData.accessToken, supabaseClient, requestBody);
        
      case 'status':
        return await getRideStatus(user.id, provider, tokenData.accessToken, supabaseClient, url.searchParams);
        
      case 'cancel':
        return await cancelRide(user.id, provider, tokenData.accessToken, supabaseClient, requestBody);
        
      case 'history':
        return await getRideHistory(user.id, supabaseClient);
        
      default:
        return errorResponse('Invalid endpoint', 404);
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return errorResponse(`Internal server error: ${error.message}`, 500);
  }
});

async function getRideEstimate(userId: string, provider: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { pickup_location, dropoff_location } = requestBody;
    
    if (!pickup_location || !dropoff_location) {
      return errorResponse('Pickup and dropoff locations are required');
    }
    
    // This is a simulation as we don't have actual API access
    // In a real implementation, you would call the respective ride service APIs
    
    // Simulate API call
    const estimatedFare = Math.floor(Math.random() * 500) + 100; // Random fare between 100-600
    const estimatedTime = Math.floor(Math.random() * 15) + 5; // Random time between 5-20 minutes
    
    return successResponse({
      provider,
      estimated_fare: estimatedFare,
      estimated_time: estimatedTime,
      currency: "INR",
      distance: "5.2 km",
      pickup_location,
      dropoff_location
    });
  } catch (error) {
    console.error("Error getting ride estimate:", error);
    return errorResponse(`Failed to get ride estimate: ${error.message}`);
  }
}

async function bookRide(userId: string, provider: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { pickup_location, dropoff_location, pickup_time = new Date().toISOString() } = requestBody;
    
    if (!pickup_location || !dropoff_location) {
      return errorResponse('Pickup and dropoff locations are required');
    }
    
    // Simulate booking API call
    const bookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fare = Math.floor(Math.random() * 500) + 100; // Random fare between 100-600
    
    // Store the booking in the database
    const { data: booking, error } = await supabaseClient.from('ride_bookings').insert({
      user_id: userId,
      provider,
      booking_id: bookingId,
      pickup_location,
      dropoff_location,
      pickup_time,
      fare,
      status: 'confirmed'
    }).select().single();
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return successResponse(booking);
  } catch (error) {
    console.error("Error booking ride:", error);
    return errorResponse(`Failed to book ride: ${error.message}`);
  }
}

async function getRideStatus(userId: string, provider: string, accessToken: string, supabaseClient: any, params: URLSearchParams) {
  try {
    const bookingId = params.get('booking_id');
    
    if (!bookingId) {
      return errorResponse('Booking ID is required');
    }
    
    // Get booking from database
    const { data: booking, error } = await supabaseClient
      .from('ride_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('booking_id', bookingId)
      .single();
    
    if (error || !booking) {
      return errorResponse('Booking not found');
    }
    
    // Simulate status update based on time since booking
    const bookingTime = new Date(booking.created_at).getTime();
    const now = new Date().getTime();
    const timeDiff = (now - bookingTime) / 1000 / 60; // minutes
    
    let status = booking.status;
    if (timeDiff > 30) {
      status = 'completed';
    } else if (timeDiff > 15) {
      status = 'in_progress';
    } else if (timeDiff > 5) {
      status = 'driver_arrived';
    } else if (timeDiff > 2) {
      status = 'driver_assigned';
    }
    
    // Update status in database if changed
    if (status !== booking.status) {
      await supabaseClient
        .from('ride_bookings')
        .update({ status, updated_at: new Date() })
        .eq('id', booking.id);
        
      booking.status = status;
    }
    
    // Add some fake driver info if appropriate
    if (['driver_assigned', 'driver_arrived', 'in_progress'].includes(status)) {
      booking.driver = {
        name: "John Driver",
        rating: 4.7,
        car: "Toyota Camry",
        car_color: "White",
        license_plate: "KA01AB1234"
      };
    }
    
    return successResponse(booking);
  } catch (error) {
    console.error("Error getting ride status:", error);
    return errorResponse(`Failed to get ride status: ${error.message}`);
  }
}

async function cancelRide(userId: string, provider: string, accessToken: string, supabaseClient: any, requestBody: any) {
  try {
    const { booking_id } = requestBody;
    
    if (!booking_id) {
      return errorResponse('Booking ID is required');
    }
    
    // Get booking from database
    const { data: booking, error } = await supabaseClient
      .from('ride_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('booking_id', booking_id)
      .single();
    
    if (error || !booking) {
      return errorResponse('Booking not found');
    }
    
    // Check if ride can be canceled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return errorResponse(`Ride cannot be cancelled as it is already ${booking.status}`);
    }
    
    // Update status in database
    await supabaseClient
      .from('ride_bookings')
      .update({ status: 'cancelled', updated_at: new Date() })
      .eq('id', booking.id);
    
    return successResponse({ success: true, message: 'Ride cancelled successfully' });
  } catch (error) {
    console.error("Error cancelling ride:", error);
    return errorResponse(`Failed to cancel ride: ${error.message}`);
  }
}

async function getRideHistory(userId: string, supabaseClient: any) {
  try {
    // Get ride history from database
    const { data: bookings, error } = await supabaseClient
      .from('ride_bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return successResponse(bookings || []);
  } catch (error) {
    console.error("Error getting ride history:", error);
    return errorResponse(`Failed to get ride history: ${error.message}`);
  }
}
