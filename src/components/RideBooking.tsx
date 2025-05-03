
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { Car, MapPin } from "lucide-react";

interface RideFormValues {
  provider: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
}

export const RideBooking = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<RideFormValues>({
    defaultValues: {
      provider: "uber", // Default provider
      pickupLocation: "",
      dropoffLocation: "",
      pickupTime: new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDThh:mm
    }
  });

  const handleSubmit = async (values: RideFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You need to be logged in to book a ride",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("ride_bookings").insert({
        user_id: user.id,
        provider: values.provider,
        pickup_location: values.pickupLocation,
        dropoff_location: values.dropoffLocation,
        pickup_time: new Date(values.pickupTime).toISOString()
      });

      if (error) throw error;

      toast({
        title: "Ride Booked",
        description: `Your ${values.provider} ride has been booked successfully!`
      });
      
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to book your ride",
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
          <Car className="h-5 w-5 text-jarvis-blue" />
          Ride Booking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Book rides through Uber, Ola, and other services with Jarvis.
        </p>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <MapPin className="h-4 w-4 mr-2" />
              Book a Ride
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Book a Ride</DialogTitle>
              <DialogDescription>
                Enter your ride details below.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ride Provider</FormLabel>
                      <FormControl>
                        <select
                          className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="uber">Uber</option>
                          <option value="ola">Ola</option>
                        </select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Home, Office, Airport" {...field} required />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dropoffLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dropoff Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mall, Restaurant, Hotel" {...field} required />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} required />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Booking Ride..." : "Book Ride"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-muted-foreground">
          Demo functionality - no actual rides will be booked
        </p>
      </CardFooter>
    </Card>
  );
};
