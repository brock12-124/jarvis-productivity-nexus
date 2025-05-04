
import { supabase } from "@/integrations/supabase/client";

export interface RideEstimate {
  provider: string;
  estimatedFare: number;
  estimatedTime: number;
  currency: string;
  distance: string;
  pickupLocation: string;
  dropoffLocation: string;
}

export interface RideBooking {
  id: string;
  provider: string;
  bookingId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string | Date;
  status: string;
  fare?: number;
  driver?: {
    name: string;
    rating: number;
    car: string;
    carColor: string;
    licensePlate: string;
  };
}

export const RideService = {
  /**
   * Get a ride estimate
   */
  async getEstimate(
    pickupLocation: string, 
    dropoffLocation: string, 
    provider: string = 'uber'
  ): Promise<RideEstimate | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/ride-service/estimate`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get ride estimate');
      }
      
      const data = await response.json();
      
      return {
        provider: data.provider,
        estimatedFare: data.estimated_fare,
        estimatedTime: data.estimated_time,
        currency: data.currency,
        distance: data.distance,
        pickupLocation: data.pickup_location,
        dropoffLocation: data.dropoff_location
      };
    } catch (error) {
      console.error('Error getting ride estimate:', error);
      return null;
    }
  },
  
  /**
   * Book a ride
   */
  async bookRide(
    pickupLocation: string, 
    dropoffLocation: string, 
    pickupTime?: string | Date,
    provider: string = 'uber'
  ): Promise<RideBooking | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/ride-service/book`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          pickup_time: pickupTime ? new Date(pickupTime).toISOString() : undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book ride');
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        provider: data.provider,
        bookingId: data.booking_id,
        pickupLocation: data.pickup_location,
        dropoffLocation: data.dropoff_location,
        pickupTime: data.pickup_time,
        status: data.status,
        fare: data.fare
      };
    } catch (error) {
      console.error('Error booking ride:', error);
      return null;
    }
  },
  
  /**
   * Get the status of a ride
   */
  async getRideStatus(bookingId: string): Promise<RideBooking | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/ride-service/status?booking_id=${encodeURIComponent(bookingId)}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get ride status');
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        provider: data.provider,
        bookingId: data.booking_id,
        pickupLocation: data.pickup_location,
        dropoffLocation: data.dropoff_location,
        pickupTime: data.pickup_time,
        status: data.status,
        fare: data.fare,
        driver: data.driver ? {
          name: data.driver.name,
          rating: data.driver.rating,
          car: data.driver.car,
          carColor: data.driver.car_color,
          licensePlate: data.driver.license_plate
        } : undefined
      };
    } catch (error) {
      console.error('Error getting ride status:', error);
      return null;
    }
  },
  
  /**
   * Cancel a ride
   */
  async cancelRide(bookingId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/ride-service/cancel`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking_id: bookingId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel ride');
      }
      
      return true;
    } catch (error) {
      console.error('Error cancelling ride:', error);
      return false;
    }
  },
  
  /**
   * Get ride history
   */
  async getRideHistory(): Promise<RideBooking[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/ride-service/history`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get ride history');
      }
      
      const data = await response.json();
      
      return (data || []).map((ride: any) => ({
        id: ride.id,
        provider: ride.provider,
        bookingId: ride.booking_id,
        pickupLocation: ride.pickup_location,
        dropoffLocation: ride.dropoff_location,
        pickupTime: ride.pickup_time,
        status: ride.status,
        fare: ride.fare
      }));
    } catch (error) {
      console.error('Error getting ride history:', error);
      return [];
    }
  }
};
