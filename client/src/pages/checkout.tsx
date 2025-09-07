import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  Shield, 
  ArrowLeft,
  Star,
  Sparkles,
  Zap,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PayPalButton from "@/components/PayPalButton";

interface PlanDetails {
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  color: string;
  gradient: string;
  icon: React.ComponentType<any>;
}

const plans: Record<string, PlanDetails> = {
  plus: {
    name: "Plus",
    price: 29,
    period: "month",
    description: "Perfect for active traders looking to enhance their performance",
    features: [
      "300 Trade Logs",
      "Advanced Analytics & Reports",
      "Private 1-on-1 Coaching Sessions",
      "Priority Email & Chat Support",
      "Advanced Psychology Tracking",
      "Custom Trade Tags & Categories",
      "Performance Benchmarking",
      "Monthly Strategy Reviews"
    ],
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    icon: Star
  },
  pro: {
    name: "Pro",
    price: 60,
    period: "month", 
    description: "For professional traders who demand the ultimate trading toolkit",
    features: [
      "All Features from Plus",
      "Unlimited Trade Logs",
      "Direct Brokerage Integration",
      "API Access & Webhooks",
      "Real-time Trade Synchronization",
      "Advanced Risk Management Tools",
      "White-label Reporting",
      "24/7 Premium Support",
      "Dedicated Account Manager",
      "Custom Analytics Dashboard"
    ],
    color: "purple",
    gradient: "from-purple-500 to-purple-600",
    icon: Sparkles
  }
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get plan from URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash && plans[hash]) {
      setSelectedPlan(hash);
    } else {
      // Redirect to landing if no valid plan
      setLocation("/");
    }
  }, [setLocation]);

  useEffect(() => {
    // If user is not authenticated, redirect to auth
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  const handlePaymentSuccess = async () => {
    setLoading(false);
    alert(`Thank you! Your ${plans[selectedPlan].name} subscription has been processed successfully. You will receive a confirmation email soon.`);
    setLocation("/dashboard");
  };

  const handlePaymentError = () => {
    setLoading(false);
    alert("There was a problem processing your payment. Please try again.");
  };

  if (!selectedPlan || !plans[selectedPlan]) {
    return null;
  }

  const plan = plans[selectedPlan];
  const IconComponent = plan.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-background/95" />
        <div className={`absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-radial from-${plan.color}-600/15 via-${plan.color}-800/8 to-transparent rounded-full filter blur-[80px]`} />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-white">
                G<span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text">metrics</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${plan.gradient} rounded-xl mb-4`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Complete <span className={`text-transparent bg-gradient-to-r ${plan.gradient} bg-clip-text`}>{plan.name}</span> Payment
              </h1>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Plan Summary */}
              <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name} Plan</h3>
                    <div className="text-3xl font-bold text-white">
                      ${plan.price}
                      <span className="text-base text-gray-400 font-normal">/{plan.period}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center text-gray-300 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-center">
                    <div className="text-green-400 text-sm font-medium">
                      30-Day Money-Back Guarantee
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Form */}
              <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 border-gray-700 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">Complete Payment</h3>
                  </div>

                  <div className="bg-gradient-to-br from-gray-800/60 to-gray-700/40 rounded-lg p-4 border border-gray-600 mb-6">
                    <div className="w-full max-w-sm mx-auto">
                      <PayPalButton 
                        amount={plan.price.toString()}
                        currency="USD"
                        intent="CAPTURE"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-300">
                      <span>Plan</span>
                      <span>{plan.name}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span>Total</span>
                      <span>${plan.price.toFixed(2)}/{plan.period}</span>
                    </div>
                  </div>

                  {loading && (
                    <div className="text-center mb-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
                      <p className="text-gray-400 text-sm">Processing payment...</p>
                    </div>
                  )}

                  <div className="text-center text-xs text-gray-500">
                    <div className="flex items-center justify-center">
                      <Shield className="h-3 w-3 mr-1" />
                      <span>Secure SSL Payment • Cancel Anytime</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}