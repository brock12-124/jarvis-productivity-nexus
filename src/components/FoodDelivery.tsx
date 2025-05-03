
import { useState, useEffect } from "react";
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
import { Pizza, ShoppingBag, Mic, Loader2, RefreshCcw, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderFormValues {
  provider: string;
  restaurant: string;
  items: string;
  address: string;
}

interface VoiceOrderState {
  isListening: boolean;
  transcript: string;
  suggestions: string[];
  processing: boolean;
}

export const FoodDelivery = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [iframeUrl, setIframeUrl] = useState("");
  const [userIntegrations, setUserIntegrations] = useState<{swiggy: boolean, zomato: boolean}>({swiggy: false, zomato: false});
  
  const [voiceOrder, setVoiceOrder] = useState<VoiceOrderState>({
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
        .in('provider', ['swiggy', 'zomato']);
      
      if (data) {
        const integrations = {
          swiggy: data.some(i => i.provider === 'swiggy'),
          zomato: data.some(i => i.provider === 'zomato')
        };
        setUserIntegrations(integrations);
      }
    };
    
    checkIntegrations();
  }, [user]);

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

  const handleEmbeddedOrder = (provider: string) => {
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
      swiggy: "https://www.swiggy.com/", 
      zomato: "https://www.zomato.com/"
    };
    
    setIframeUrl(urls[provider as keyof typeof urls]);
    setActiveTab("embedded");
  };

  const handleVoiceCommand = () => {
    // Simulate voice recognition
    setVoiceOrder(prev => ({...prev, isListening: true, transcript: ""}));
    
    // In a real app, we would use the Web Speech API
    setTimeout(() => {
      setVoiceOrder(prev => ({
        ...prev, 
        isListening: false,
        transcript: "I want to order a veggie pizza and garlic bread from Domino's"
      }));
      
      // Process the voice command
      processVoiceCommand("I want to order a veggie pizza and garlic bread from Domino's");
    }, 2000);
  };
  
  const processVoiceCommand = (command: string) => {
    setVoiceOrder(prev => ({...prev, processing: true}));
    
    // In a real app, we would use NLP to extract entities
    setTimeout(() => {
      setVoiceOrder(prev => ({
        ...prev,
        processing: false,
        suggestions: [
          "Veggie Paradise from Domino's",
          "Farmhouse Pizza from Domino's",
          "Garlic Breadsticks"
        ]
      }));
      
      // Pre-fill the form
      form.setValue("provider", "swiggy");
      form.setValue("restaurant", "Domino's Pizza");
      form.setValue("items", "Veggie Paradise Pizza\nGarlic Breadsticks");
    }, 1500);
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
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Order Food</DialogTitle>
              <DialogDescription>
                Choose how you want to order your food.
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
              </TabsContent>
              
              <TabsContent value="voice">
                <div className="space-y-4 py-4">
                  <div className="flex justify-center mb-6">
                    <Button 
                      size="lg" 
                      className={voiceOrder.isListening ? "bg-red-500 hover:bg-red-600" : ""} 
                      onClick={handleVoiceCommand}
                      disabled={voiceOrder.isListening || voiceOrder.processing}
                    >
                      {voiceOrder.isListening ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Listening...
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          {voiceOrder.transcript ? "Try Again" : "Speak Your Order"}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {voiceOrder.transcript && (
                    <div className="border rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-2">You said:</h4>
                      <p className="text-sm">{voiceOrder.transcript}</p>
                    </div>
                  )}
                  
                  {voiceOrder.processing && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-jarvis-blue" />
                    </div>
                  )}
                  
                  {voiceOrder.suggestions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Suggested items:</h4>
                      <div className="space-y-2">
                        {voiceOrder.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="flex justify-between items-center border rounded-md p-2">
                            <span>{suggestion}</span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-500">
                                +
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setActiveTab("form")}>
                          Edit Order
                        </Button>
                        <Button onClick={() => form.handleSubmit(handleSubmit)()}>
                          Place Order
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
                      <p className="text-sm text-muted-foreground mb-2">Choose a food delivery app:</p>
                      <Button 
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={() => handleEmbeddedOrder('swiggy')}
                      >
                        Open Swiggy
                      </Button>
                      <Button 
                        className="bg-red-500 hover:bg-red-600"
                        onClick={() => handleEmbeddedOrder('zomato')}
                      >
                        Open Zomato
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Ordering from: {iframeUrl.includes('swiggy') ? 'Swiggy' : 'Zomato'}</h3>
                        <Button variant="ghost" size="sm" onClick={() => setIframeUrl("")}>
                          <X className="h-4 w-4 mr-1" /> Close
                        </Button>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <iframe 
                          src={iframeUrl} 
                          title="Food Delivery App" 
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
          Connect with Swiggy/Zomato in Integration Hub for full experience
        </p>
      </CardFooter>
    </Card>
  );
};
