
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { Car, MapPin, Mic, Loader2, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RideFormValues {
  provider: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
}

interface VoiceBookingState {
  isListening: boolean;
  transcript: string;
  suggestions: {
    provider: string;
    type: string;
    fare: string;
    eta: string;
  }[];
  processing: boolean;
}

export const RideBooking = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [iframeUrl, setIframeUrl] = useState("");
  const [userIntegrations, setUserIntegrations] = useState<{uber: boolean, ola: boolean}>({uber: false, ola: false});
  
  const [voiceBooking, setVoiceBooking] = useState<VoiceBookingState>({
    isListening: false,
    transcript: "",
    suggestions: [],
    processing: false
  });

  // Check for user integrations
  useEffect(() => {
    if (!user) return;
    
    const checkIntegrations = async () => {
      const { data } = await supabase
        .from('user_integrations')
        .select('provider')
        .eq('user_id', user.id)
        .in('provider', ['uber', 'ola']);
      
      if (data) {
        const integrations = {
          uber: data.some(i => i.provider === 'uber'),
          ola: data.some(i => i.provider === 'ola')
        };
        setUserIntegrations(integrations);
      }
    };
    
    checkIntegrations();
  }, [user]);

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

  const handleEmbeddedBooking = (provider: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to your Jarvis account first",
        variant: "destructive"
      });
      return;
    }
    
    if (!userIntegrations[provider as keyof typeof userIntegrations]) {
      toast({
        title: "Connect account first",
        description: `Please connect your ${provider} account in the Integration Hub`,
      });
      return;
    }
    
    // In a real app, we would use actual embedded URLs or deep links
    const urls = {
      uber: "https://m.uber.com/",
      ola: "https://book.olacabs.com/"
    };
    
    setIframeUrl(urls[provider as keyof typeof urls]);
    setActiveTab("embedded");
  };

  const handleVoiceCommand = () => {
    // Simulate voice recognition
    setVoiceBooking(prev => ({...prev, isListening: true, transcript: ""}));
    
    // In a real app, we would use the Web Speech API
    setTimeout(() => {
      setVoiceBooking(prev => ({
        ...prev, 
        isListening: false,
        transcript: "I need a cab from my office to airport at 5 PM today"
      }));
      
      // Process the voice command
      processVoiceCommand("I need a cab from my office to airport at 5 PM today");
    }, 2000);
  };
  
  const processVoiceCommand = (command: string) => {
    setVoiceBooking(prev => ({...prev, processing: true}));
    
    // In a real app, we would use NLP to extract entities
    setTimeout(() => {
      const today = new Date();
      today.setHours(17, 0, 0);
      
      setVoiceBooking(prev => ({
        ...prev,
        processing: false,
        suggestions: [
          {
            provider: "Uber",
            type: "UberX",
            fare: "$25-30",
            eta: "5 min"
          },
          {
            provider: "Uber",
            type: "Uber Black", 
            fare: "$45-50",
            eta: "3 min"
          },
          {
            provider: "Ola",
            type: "Ola Mini",
            fare: "$22-28",
            eta: "7 min"
          }
        ]
      }));
      
      // Pre-fill the form
      form.setValue("provider", "uber");
      form.setValue("pickupLocation", "My Office");
      form.setValue("dropoffLocation", "Airport");
      form.setValue("pickupTime", today.toISOString().slice(0, 16));
    }, 1500);
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
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Book a Ride</DialogTitle>
              <DialogDescription>
                Choose how you want to book your ride.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="form">Form</TabsTrigger>
                <TabsTrigger value="voice">Voice Command</TabsTrigger>
                <TabsTrigger value="embedded">Use App</TabsTrigger>
              </TabsList>
              
              <TabsContent value="form">
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
              </TabsContent>
              
              <TabsContent value="voice">
                <div className="space-y-4 py-4">
                  <div className="flex justify-center mb-6">
                    <Button 
                      size="lg" 
                      className={voiceBooking.isListening ? "bg-red-500 hover:bg-red-600" : ""} 
                      onClick={handleVoiceCommand}
                      disabled={voiceBooking.isListening || voiceBooking.processing}
                    >
                      {voiceBooking.isListening ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Listening...
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          {voiceBooking.transcript ? "Try Again" : "Speak Your Request"}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {voiceBooking.transcript && (
                    <div className="border rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-2">You said:</h4>
                      <p className="text-sm">{voiceBooking.transcript}</p>
                    </div>
                  )}
                  
                  {voiceBooking.processing && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-jarvis-blue" />
                    </div>
                  )}
                  
                  {voiceBooking.suggestions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Available rides:</h4>
                      <div className="space-y-2">
                        {voiceBooking.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="border rounded-md p-3 flex justify-between">
                            <div>
                              <div className="font-medium">{suggestion.provider} - {suggestion.type}</div>
                              <div className="text-sm text-muted-foreground">Arrives in {suggestion.eta}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{suggestion.fare}</div>
                              <Button size="sm" className="mt-1" onClick={() => {
                                form.setValue("provider", suggestion.provider.toLowerCase());
                                form.handleSubmit(handleSubmit)();
                              }}>
                                Book Now
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setActiveTab("form")}>
                          Edit Details
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="embedded">
                <div className="space-y-4 py-4">
                  {!iframeUrl ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground mb-2">Choose a ride service:</p>
                      <Button 
                        className="bg-black hover:bg-gray-800"
                        onClick={() => handleEmbeddedBooking('uber')}
                      >
                        Open Uber
                      </Button>
                      <Button 
                        className="bg-yellow-500 hover:bg-yellow-600"
                        onClick={() => handleEmbeddedBooking('ola')}
                      >
                        Open Ola
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Booking with: {iframeUrl.includes('uber') ? 'Uber' : 'Ola'}</h3>
                        <Button variant="ghost" size="sm" onClick={() => setIframeUrl("")}>
                          <X className="h-4 w-4 mr-1" /> Close
                        </Button>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <iframe 
                          src={iframeUrl} 
                          title="Ride Booking App" 
                          className="w-full h-[400px] border-0"
                          sandbox="allow-same-origin allow-scripts allow-forms"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Note: Some websites may block embedding in iframes. This is a demo representation.
                      </p>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-muted-foreground">
          Connect with Uber/Ola in Integration Hub for full experience
        </p>
      </CardFooter>
    </Card>
  );
};
