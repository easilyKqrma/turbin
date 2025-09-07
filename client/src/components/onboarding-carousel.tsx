import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/components/ui/theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, Settings, Sparkles, 
  Computer, Smartphone, Eye, EyeOff, 
  Sun, Moon, Monitor, TrendingUp, 
  BarChart3, Activity, Target, 
  Clock, Heart, Camera, Calculator,
  Loader2, CheckCircle
} from "lucide-react";

interface OnboardingCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface UserPreferences {
  preferredTradeInput: 'modal' | 'carousel';
  defaultTradeVisibility: 'public' | 'private';
  preferredTheme: 'light' | 'dark' | 'system';
}

const tips = [
  "Check your stats in the Stats section to improve your trading",
  "You can add emotions to your trades to understand your psychology",
  "Trading accounts help you organize different strategies",
  "Use screenshots to better document your setups",
  "P&L analysis shows you patterns in your performance",
  "Notes on trades are key to improving your strategy"
];

export default function OnboardingCarousel({ open, onOpenChange, userId }: OnboardingCarouselProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferredTradeInput: 'modal',
    defaultTradeVisibility: 'private',
    preferredTheme: 'system'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  // Cycle through tips during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentTip(prev => (prev + 1) % tips.length);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Let\'s customize your experience',
      description: 'We\'ll ask you a few quick questions to configure gmetrics according to your preferences',
      component: null // No component for welcome step to avoid empty card
    },
    {
      id: 'trade-input',
      title: 'Trade input method',
      description: 'Do you prefer to add your trades manually or have gmetrics guide you step by step?',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Modal tradicional */}
            <Button
              variant={preferences.preferredTradeInput === 'modal' ? "default" : "outline"}
              onClick={() => setPreferences(prev => ({ ...prev, preferredTradeInput: 'modal' }))}
              className={`h-auto p-3 sm:p-6 flex flex-col items-start space-y-2 sm:space-y-3 ${
                preferences.preferredTradeInput === 'modal' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
              }`}
              data-testid="onboarding-select-modal"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Computer className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base">Complete Form (Traditional)</span>
              </div>
              <p className="text-xs sm:text-sm text-left opacity-90 leading-tight">
                See all fields at once. Perfect if you already have<br className="sm:hidden" /> experience adding trades.
              </p>
              
              {/* Demo visual */}
              <div className="w-full mt-4 p-3 bg-black/20 rounded-lg">
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <div className="h-2 bg-gray-600 rounded w-1/3"></div>
                    <div className="h-2 bg-gray-600 rounded w-1/4"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-2 bg-gray-600 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-600 rounded w-1/3"></div>
                  </div>
                  <div className="h-2 bg-gray-600 rounded w-2/3"></div>
                  <div className="flex justify-end">
                    <div className="h-4 bg-blue-500 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </Button>

            {/* Carousel guiado */}
            <Button
              variant={preferences.preferredTradeInput === 'carousel' ? "default" : "outline"}
              onClick={() => setPreferences(prev => ({ ...prev, preferredTradeInput: 'carousel' }))}
              className={`h-auto p-3 sm:p-6 flex flex-col items-start space-y-2 sm:space-y-3 ${
                preferences.preferredTradeInput === 'carousel' 
                  ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' 
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
              }`}
              data-testid="onboarding-select-carousel"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Smartphone className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base">Step by step (Recommended)</span>
              </div>
              <p className="text-xs sm:text-sm text-left opacity-90 leading-tight">
                We guide you question by question. Ideal for<br className="sm:hidden" /> quicker logs & greater focus.
              </p>
              
              {/* Demo visual */}
              <div className="w-full mt-4 p-3 bg-black/20 rounded-lg">
                <div className="space-y-2">
                  <div className="w-full h-1 bg-gray-700 rounded">
                    <div className="h-1 bg-green-500 rounded w-1/3"></div>
                  </div>
                  <div className="text-center">
                    <div className="h-3 bg-gray-600 rounded w-1/2 mx-auto mb-2"></div>
                    <div className="h-8 bg-gray-600 rounded"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-600 rounded w-16"></div>
                    <div className="h-4 bg-green-500 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            💡 You can change this later in the settings
          </div>
        </div>
      )
    },
    {
      id: 'visibility',
      title: 'Trade privacy',
      description: 'Do you want your trades to be shown publicly or do you prefer to keep them private?',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant={preferences.defaultTradeVisibility === 'private' ? "default" : "outline"}
              onClick={() => setPreferences(prev => ({ ...prev, defaultTradeVisibility: 'private' }))}
              className={`h-auto p-3 sm:p-6 flex flex-col items-start space-y-2 sm:space-y-3 ${
                preferences.defaultTradeVisibility === 'private' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500' 
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
              }`}
              data-testid="onboarding-select-private"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base">Private (Recommended)</span>
              </div>
              <p className="text-xs text-left opacity-90">
                Only you can see your trades. Greater privacy and security.
              </p>
            </Button>

            <Button
              variant={preferences.defaultTradeVisibility === 'public' ? "default" : "outline"}
              onClick={() => setPreferences(prev => ({ ...prev, defaultTradeVisibility: 'public' }))}
              className={`h-auto p-3 sm:p-6 flex flex-col items-start space-y-2 sm:space-y-3 ${
                preferences.defaultTradeVisibility === 'public' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
              }`}
              data-testid="onboarding-select-public"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base">Public</span>
              </div>
              <p className="text-xs text-left opacity-90">
                Share your trades with people. Perfect for showing strategies.
              </p>
            </Button>
          </div>

          <div className="text-xs sm:text-sm text-gray-500 text-center px-2">
            💡 You can change the visibility of each trade individually
          </div>
        </div>
      )
    },
    {
      id: 'theme',
      title: 'Application theme',
      description: 'Do you prefer to use our light, dark, or automatic theme?',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant={preferences.preferredTheme === 'light' ? "default" : "outline"}
              onClick={() => {
                setPreferences(prev => ({ ...prev, preferredTheme: 'light' }));
                setTheme('light');
              }}
              className={`h-auto p-3 sm:p-6 flex flex-col items-start space-y-2 sm:space-y-3 ${
                preferences.preferredTheme === 'light' 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500' 
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
              }`}
              data-testid="onboarding-select-light"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base">Light Theme</span>
              </div>
              <p className="text-xs sm:text-sm text-left opacity-90">
                Bright interface, ideal for working during the day.
              </p>
            </Button>

            <Button
              variant={preferences.preferredTheme === 'dark' ? "default" : "outline"}
              onClick={() => {
                setPreferences(prev => ({ ...prev, preferredTheme: 'dark' }));
                setTheme('dark');
              }}
              className={`h-auto p-3 sm:p-6 flex flex-col items-start space-y-2 sm:space-y-3 ${
                preferences.preferredTheme === 'dark' 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-500' 
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
              }`}
              data-testid="onboarding-select-dark"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Moon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base">Dark Theme</span>
              </div>
              <p className="text-xs sm:text-sm text-left opacity-90">
                Reduces visual fatigue, perfect for long sessions.
              </p>
            </Button>

            <Button
              variant={preferences.preferredTheme === 'system' ? "default" : "outline"}
              onClick={() => {
                setPreferences(prev => ({ ...prev, preferredTheme: 'system' }));
                // Para sistema, aplicar theme system
                setTheme('system');
              }}
              className={`h-auto p-3 sm:p-6 flex flex-col items-start space-y-2 sm:space-y-3 ${
                preferences.preferredTheme === 'system' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
              }`}
              data-testid="onboarding-select-system"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Monitor className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base">Automatic (Recommended)</span>
              </div>
              <p className="text-xs sm:text-sm text-left opacity-90">
                Automatically adapts to your device settings.
              </p>
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'loading',
      title: 'Setting up your account',
      description: 'We are preparing everything for you...',
      component: (
        <div className="text-center space-y-8">
          <div className="custom-loader-container">
            <div className="custom-loader"></div>
            <div className="custom-loader"></div>
            <div className="custom-loader"></div>
          </div>
          
          <div className="space-y-4">
            <motion.div
              key={currentTip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-center space-x-2 text-blue-400">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Trading tip</span>
              </div>
              <p className="text-gray-300 max-w-md mx-auto">
                {tips[currentTip]}
              </p>
            </motion.div>
          </div>

          <div className="flex justify-center space-x-2">
            {tips.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentTip ? 'bg-blue-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      )
    }
  ];

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      // Simular tiempo de carga completo para mostrar tips (aproximadamente 18 segundos para 6 tips)
      await new Promise(resolve => setTimeout(resolve, 18000));
      
      const response = await apiRequest('PUT', `/api/users/${userId}/preferences`, {
        ...prefs,
        hasCompletedOnboarding: true
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration completed!",
        description: "Your account has been configured correctly",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Reload the page after a brief delay to show the success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      setIsLoading(false);
      console.error("Error updating preferences:", error);
      toast({
        title: "Error",
        description: "Could not save preferences",
        variant: "destructive",
      });
    },
  });

  const handleFinish = () => {
    setCurrentStep(steps.length - 1); // Go to loading step
    setIsLoading(true);
    updatePreferencesMutation.mutate(preferences);
  };

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 2; // Before loading step
  const isLoadingStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(openState) => {
      // Prevenir cerrar durante la carga, loading step, o en el primer step
      if (isLoading || isLoadingStep || isFirstStep) {
        return;
      }
      onOpenChange(openState);
    }}>
      <DialogContent 
        className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-gray-900/95 border border-gray-700/50 text-white backdrop-blur-sm mx-2 sm:mx-4"
        onPointerDownOutside={(e) => {
          // Prevenir cerrar haciendo click fuera durante carga o en primer step
          if (isLoading || isLoadingStep || isFirstStep) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevenir cerrar con escape durante carga o en primer step
          if (isLoading || isLoadingStep || isFirstStep) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Settings className="h-6 w-6 mr-2 text-blue-400" />
            Initial Setup
          </DialogTitle>
          
          {/* Progress bar - hide during loading */}
          {!isLoadingStep && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Step {currentStep + 1} of {steps.length - 1}</span>
                <span>{Math.round(((currentStep + 1) / (steps.length - 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / (steps.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-400 px-2">
                  {currentStepData.description}
                </p>
              </div>

              {currentStepData.component && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-3 sm:p-6">
                    {currentStepData.component}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons - hide during loading */}
          {!isLoadingStep && (
            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isFirstStep}
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                data-testid="onboarding-previous-step"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {isLastStep ? (
                <Button
                  onClick={handleFinish}
                  disabled={updatePreferencesMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  data-testid="onboarding-finish"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finish setup
                </Button>
              ) : (
                <Button
                  onClick={goToNextStep}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  data-testid="onboarding-next-step"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}