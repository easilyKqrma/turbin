import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { defaultEmotions, getEmotionsByCategory, getIconByName } from "@/lib/emotions";
import type { Emotion, UserEmotion } from "@shared/schema";
import { Plus } from "lucide-react";

const emotionLogSchema = z.object({
  emotionId: z.string().optional(),
  userEmotionId: z.string().optional(),
}).refine(data => data.emotionId || data.userEmotionId, {
  message: "Please select an emotion",
});

const customEmotionSchema = z.object({
  name: z.string().min(1, "Emotion name is required"),
  icon: z.string().min(1, "Icon name is required"),
  category: z.enum(['positive', 'negative', 'neutral']),
});

type EmotionLogFormData = z.infer<typeof emotionLogSchema>;
type CustomEmotionFormData = z.infer<typeof customEmotionSchema>;

interface EmotionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmotionModal({ open, onOpenChange }: EmotionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [selectedEmotion, setSelectedEmotion] = useState<{
    id: string;
    name: string;
    icon: string;
    isCustom: boolean;
  } | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const form = useForm<EmotionLogFormData>({
    resolver: zodResolver(emotionLogSchema),
  });

  const customForm = useForm<CustomEmotionFormData>({
    resolver: zodResolver(customEmotionSchema),
    defaultValues: {
      category: 'neutral',
    },
  });

  const { data: emotions = [] } = useQuery<Emotion[]>({
    queryKey: ['/api/emotions'],
  });

  const { data: userEmotions = [] } = useQuery<UserEmotion[]>({
    queryKey: ['/api/emotions', 'user'],
  });

  const createEmotionLogMutation = useMutation({
    mutationFn: async (data: EmotionLogFormData) => {
      await apiRequest('POST', '/api/emotion-logs', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Emotion logged successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/emotion-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emotion-logs', 'stats'] });
      onOpenChange(false);
      form.reset();
      setSelectedEmotion(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to log emotion",
        variant: "destructive",
      });
    },
  });

  const createUserEmotionMutation = useMutation({
    mutationFn: async (data: CustomEmotionFormData) => {
      await apiRequest('POST', '/api/emotions/user', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Custom emotion created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/emotions', 'user'] });
      customForm.reset();
      setShowCustomForm(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create custom emotion",
        variant: "destructive",
      });
    },
  });

  const allEmotions = [
    ...emotions.map(e => ({ ...e, isCustom: false })),
    ...userEmotions.map(e => ({ ...e, isCustom: true })),
  ];

  const filteredEmotions = selectedCategory === 'all' 
    ? allEmotions 
    : allEmotions.filter(e => e.category === selectedCategory);

  const handleEmotionSelect = (emotion: typeof allEmotions[0]) => {
    setSelectedEmotion({
      id: emotion.id,
      name: emotion.name,
      icon: emotion.icon,
      isCustom: emotion.isCustom,
    });

    // Auto-submit when emotion is selected
    const formData: EmotionLogFormData = emotion.isCustom 
      ? { userEmotionId: emotion.id }
      : { emotionId: emotion.id };
    
    createEmotionLogMutation.mutate(formData);
  };

  const handleSubmit = (data: EmotionLogFormData) => {
    createEmotionLogMutation.mutate(data);
  };

  const handleCustomEmotionSubmit = (data: CustomEmotionFormData) => {
    createUserEmotionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle>Log Your Trading Emotions</DialogTitle>
        </DialogHeader>

        {!showCustomForm ? (
          <div className="space-y-6">
            {/* Category Filter */}
            <div className="flex space-x-2">
              <Button 
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                data-testid="filter-all"
              >
                All
              </Button>
              <Button 
                variant={selectedCategory === 'positive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('positive')}
                data-testid="filter-positive"
              >
                Positive
              </Button>
              <Button 
                variant={selectedCategory === 'negative' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('negative')}
                data-testid="filter-negative"
              >
                Negative
              </Button>
              <Button 
                variant={selectedCategory === 'neutral' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('neutral')}
                data-testid="filter-neutral"
              >
                Neutral
              </Button>
            </div>

            {/* Emotions Grid */}
            <div className="emotion-grid">
              {filteredEmotions.map((emotion) => (
                <Button
                  key={emotion.id}
                  variant="ghost"
                  className={`p-3 h-auto rounded-lg border transition-all ${
                    selectedEmotion?.id === emotion.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'border-transparent hover:border-muted-foreground'
                  } ${
                    emotion.category === 'positive' ? 'hover:bg-success/10 hover:border-success' :
                    emotion.category === 'negative' ? 'hover:bg-destructive/10 hover:border-destructive' :
                    'hover:bg-primary/10 hover:border-primary'
                  }`}
                  onClick={() => handleEmotionSelect(emotion)}
                  data-testid={`emotion-${emotion.name.toLowerCase()}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-1">
                      {(() => {
                        const IconComponent = getIconByName(emotion.icon);
                        return <IconComponent className="h-6 w-6" />;
                      })()}
                    </div>
                    <div className="text-xs text-center">{emotion.name}</div>
                  </div>
                </Button>
              ))}

              {/* Add Custom Emotion Button */}
              <Button
                variant="ghost"
                className="p-3 h-auto rounded-lg border-2 border-dashed border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500"
                onClick={() => setShowCustomForm(true)}
                data-testid="button-add-custom-emotion"
              >
                <div className="flex flex-col items-center">
                  <Plus className="h-6 w-6 mb-1" />
                  <div className="text-xs text-center">Add Custom</div>
                </div>
              </Button>
            </div>

            {/* Simple instruction text */}
            <div className="text-center">
              <p className="text-muted-foreground">
                Click on an emotion above to log it instantly
              </p>
              {createEmotionLogMutation.isPending && (
                <p className="text-sm text-blue-600 mt-2">Saving emotion...</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">Create Custom Emotion</h3>
                <p className="text-sm text-muted-foreground">Add a personalized emotion to track your trading psychology</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCustomForm(false)}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-back-to-emotions"
              >
                ← Back
              </Button>
            </div>

            <div className="bg-muted/30 rounded-xl p-6 border">
            <form onSubmit={customForm.handleSubmit(handleCustomEmotionSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customIcon" className="text-sm font-medium text-foreground">Icon Name</Label>
                <Input
                  id="customIcon"
                  placeholder="Heart, Star, Target, Zap, AlertCircle..."
                  {...customForm.register('icon')}
                  className="bg-background/50 border-border/50 focus:border-ring transition-colors"
                  data-testid="input-custom-icon"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Use Lucide React icon names. Preview at lucide.dev
                </p>
                {customForm.formState.errors.icon && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                    <span className="w-1 h-1 bg-destructive rounded-full"></span>
                    {customForm.formState.errors.icon.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customName" className="text-sm font-medium text-foreground">Emotion Name</Label>
                <Input
                  id="customName"
                  placeholder="e.g., Overconfident, Anxious, Focused, FOMO"
                  {...customForm.register('name')}
                  className="bg-background/50 border-border/50 focus:border-ring transition-colors"
                  data-testid="input-custom-name"
                />
                {customForm.formState.errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                    <span className="w-1 h-1 bg-destructive rounded-full"></span>
                    {customForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Emotion Category</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => customForm.setValue('category', 'positive')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-1 ${
                      customForm.watch('category') === 'positive'
                        ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-300 scale-105 shadow-lg'
                        : 'border-border hover:border-green-500/50 text-muted-foreground hover:text-green-600 dark:hover:text-green-400'
                    }`}
                    data-testid="button-custom-positive"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Positive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => customForm.setValue('category', 'neutral')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-1 ${
                      customForm.watch('category') === 'neutral'
                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 scale-105 shadow-lg'
                        : 'border-border hover:border-yellow-500/50 text-muted-foreground hover:text-yellow-600 dark:hover:text-yellow-400'
                    }`}
                    data-testid="button-custom-neutral"
                  >
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Neutral</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => customForm.setValue('category', 'negative')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-1 ${
                      customForm.watch('category') === 'negative'
                        ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 scale-105 shadow-lg'
                        : 'border-border hover:border-red-500/50 text-muted-foreground hover:text-red-600 dark:hover:text-red-400'
                    }`}
                    data-testid="button-custom-negative"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">Negative</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 transition-all duration-200 shadow-lg"
                  disabled={createUserEmotionMutation.isPending}
                  data-testid="button-save-custom-emotion"
                >
                  {createUserEmotionMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Emotion'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCustomForm(false)}
                  className="py-2.5 transition-all duration-200"
                  data-testid="button-cancel-custom"
                >
                  Cancel
                </Button>
              </div>
            </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
