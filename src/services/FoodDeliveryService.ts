
import { supabase } from "@/integrations/supabase/client";

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceRange: string;
  imageUrl: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isVeg: boolean;
}

export interface Order {
  id: string;
  provider: string;
  orderId: string;
  restaurantName: string;
  deliveryAddress: string;
  orderItems: OrderItem[];
  orderTotal: number;
  status: string;
  createdAt: string;
  deliveryPerson?: {
    name: string;
    phone: string;
    estimatedArrival: string;
  };
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export const FoodDeliveryService = {
  /**
   * Search for restaurants
   */
  async searchRestaurants(
    query: string,
    latitude: number,
    longitude: number,
    provider: string = 'zomato'
  ): Promise<Restaurant[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/food-delivery/search-restaurants?provider=${encodeURIComponent(provider)}&query=${encodeURIComponent(query)}&latitude=${latitude}&longitude=${longitude}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search restaurants');
      }
      
      const data = await response.json();
      
      return (data?.restaurants || []).map((restaurant: any) => ({
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        rating: restaurant.rating,
        deliveryTime: restaurant.delivery_time,
        priceRange: restaurant.price_range,
        imageUrl: restaurant.image_url
      }));
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return [];
    }
  },
  
  /**
   * Get a restaurant's menu
   */
  async getRestaurantMenu(
    restaurantId: string,
    provider: string = 'zomato'
  ): Promise<{ restaurant: Restaurant, menuItems: MenuItem[] } | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/food-delivery/get-menu?provider=${encodeURIComponent(provider)}&restaurant_id=${encodeURIComponent(restaurantId)}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get restaurant menu');
      }
      
      const data = await response.json();
      
      const restaurant: Restaurant = {
        id: data.restaurant.id,
        name: data.restaurant.name,
        cuisine: data.restaurant.cuisine,
        rating: data.restaurant.rating,
        deliveryTime: data.restaurant.delivery_time,
        priceRange: data.restaurant.price_range,
        imageUrl: data.restaurant.image_url
      };
      
      const menuItems: MenuItem[] = (data.menu_items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.image_url,
        category: item.category,
        isVeg: item.veg
      }));
      
      return { restaurant, menuItems };
    } catch (error) {
      console.error('Error getting restaurant menu:', error);
      return null;
    }
  },
  
  /**
   * Place an order
   */
  async placeOrder(
    restaurantName: string,
    deliveryAddress: string,
    orderItems: OrderItem[],
    provider: string = 'zomato'
  ): Promise<Order | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/food-delivery/place-order`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          restaurant_name: restaurantName,
          delivery_address: deliveryAddress,
          order_items: orderItems
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        provider: data.provider,
        orderId: data.order_id,
        restaurantName: data.restaurant_name,
        deliveryAddress: data.delivery_address,
        orderItems: data.order_items,
        orderTotal: data.order_total,
        status: data.status,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error placing order:', error);
      return null;
    }
  },
  
  /**
   * Get the status of an order
   */
  async getOrderStatus(orderId: string, provider: string = 'zomato'): Promise<Order | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/food-delivery/order-status?provider=${encodeURIComponent(provider)}&order_id=${encodeURIComponent(orderId)}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get order status');
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        provider: data.provider,
        orderId: data.order_id,
        restaurantName: data.restaurant_name,
        deliveryAddress: data.delivery_address,
        orderItems: data.order_items,
        orderTotal: data.order_total,
        status: data.status,
        createdAt: data.created_at,
        deliveryPerson: data.delivery_person ? {
          name: data.delivery_person.name,
          phone: data.delivery_person.phone,
          estimatedArrival: data.delivery_person.estimated_arrival
        } : undefined
      };
    } catch (error) {
      console.error('Error getting order status:', error);
      return null;
    }
  },
  
  /**
   * Get order history
   */
  async getOrderHistory(): Promise<Order[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const endpoint = `${supabase.functions.url}/food-delivery/order-history`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get order history');
      }
      
      const data = await response.json();
      
      return (data || []).map((order: any) => ({
        id: order.id,
        provider: order.provider,
        orderId: order.order_id,
        restaurantName: order.restaurant_name,
        deliveryAddress: order.delivery_address,
        orderItems: order.order_items,
        orderTotal: order.order_total,
        status: order.status,
        createdAt: order.created_at
      }));
    } catch (error) {
      console.error('Error getting order history:', error);
      return [];
    }
  }
};
