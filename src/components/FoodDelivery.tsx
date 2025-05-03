
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { Pizza, ShoppingBag } from "lucide-react";

interface OrderFormValues {
  provider: string;
  restaurant: string;
  items: string;
  address: string;
}

export const FoodDelivery = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<OrderFormValues>({
    defaultValues: {
      provider: "swiggy", // Default provider
      restaurant: "",
      items: "",
      address: ""
    }
  });

  const handleSubmit = async (values: OrderFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to order food",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse the items from text to a JSON array
      const orderItems = values.items.split("\n").map(item => ({ 
        name: item.trim(),
        quantity: 1
      }));
      
      const { error } = await supabase.from("food_orders").insert({
        user_id: user.id,
        provider: values.provider,
        restaurant_name: values.restaurant,
        delivery_address: values.address,
        order_items: orderItems,
        order_total: 0 // In a real app, we would calculate this
      });

      if (error) throw error;

      toast({
        title: "Order Placed",
        description: `Your order from ${values.restaurant} has been placed successfully!`
      });
      
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place your order",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pizza className="h-5 w-5 text-jarvis-blue" />
          Food Delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Order food from your favorite restaurants through Jarvis.
        </p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Place an Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Order Food</DialogTitle>
              <DialogDescription>
                Enter your food order details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Provider</FormLabel>
                      <FormControl>
                        <select
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="swiggy">Swiggy</option>
                          <option value="zomato">Zomato</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="restaurant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pizza Hut, McDonald's" {...field} required />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="items"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Items (one per line)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g.&#10;Margherita Pizza&#10;French Fries&#10;Coca Cola" 
                          className="min-h-[100px]"
                          {...field} 
                          required
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your full delivery address" 
                          {...field} 
                          required
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-muted-foreground">
          Demo functionality - no actual orders will be placed
        </p>
      </CardFooter>
    </Card>
  );
};
