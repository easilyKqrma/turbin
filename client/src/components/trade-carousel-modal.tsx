import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { getIconByName } from "@/lib/emotions";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, TrendingUp, TrendingDown, Check, ChevronsUpDown, 
  Image as ImageIcon, Heart, X, DollarSign, Calculator, 
  Wallet, Settings, ArrowLeft, ArrowRight, SkipForward,
  Clock, Camera, Target, Activity
} from "lucide-react";

// Local types to avoid import issues
type Instrument = {
  id: string;
  symbol: string;
  name: string;
  tickValue: string;
  tickSize: string;
  multiplier: number;
  isCustom: boolean;
};

type Emotion = {
  id: string;
  name: string;
  icon: string;
  category: string;
  isDefault: boolean;
};

type AccountWithStats = {
  id: string;
  userId: string;
  name: string;
  accountType: string;
  initialCapital: string;
  currentCapital: string;
  currency: string;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  totalTrades?: number;
  totalPnl?: number;
  winRate?: number;
};

const tradeSchema = z.object({
  accountId: z.string().optional(),
  instrumentId: z.string().optional(),
  customInstrument: z.string().optional(),
  direction: z.enum(['long', 'short']),
  entryPrice: z.string().optional(),
  exitPrice: z.string().optional(),
  lotSize: z.string().min(1, "Lot size is required"),
  customPnl: z.string().optional(),
  notes: z.string().optional(),
  imageFile: z.any().optional(),
  emotionId: z.string().optional(),
  entryDateTime: z.string().optional(),
  exitDateTime: z.string().optional(),
  entryDate: z.string().optional(),
  entryTime: z.string().optional(),
  exitDate: z.string().optional(),
  exitTime: z.string().optional(),
  tradeType: z.enum(['scalp', 'day', 'swing']).optional(),
}).refine(data => data.instrumentId || data.customInstrument, {
  message: "Select an instrument or write a custom one",
  path: ["customInstrument"],
});

type TradeFormData = z.infer<typeof tradeSchema>;

interface TradeCarouselModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade?: any; // Optional trade for editing
}

interface CarouselStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isOptional: boolean;
  component: React.ReactNode;
}

export default function TradeCarouselModal({ open, onOpenChange, trade }: TradeCarouselModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Carousel state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Form state
  const [instrumentSearchOpen, setInstrumentSearchOpen] = useState(false);
  const [instrumentSearch, setInstrumentSearch] = useState("");
  const [customTicker, setCustomTicker] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [emotionDropdownOpen, setEmotionDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form first
  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      direction: 'long',
      lotSize: '1',
      accountId: '', // Initialize with empty string
      instrumentId: '', // Initialize with empty string
      customInstrument: '', // Initialize with empty string
      entryPrice: '', // Initialize with empty string
      exitPrice: '', // Initialize with empty string
      customPnl: '', // Initialize with empty string
      notes: '', // Initialize with empty string
      tradeType: undefined, // Initialize as undefined
    },
  });

  // Helper functions
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        form.setValue('imageFile', file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue('imageFile', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Queries
  const { data: instruments = [] } = useQuery<Instrument[]>({
    queryKey: ['/api/instruments'],
  });

  const { data: emotions = [] } = useQuery<Emotion[]>({
    queryKey: ['/api/emotions'],
  });

  const { data: userEmotions = [] } = useQuery<any[]>({
    queryKey: ['/api/emotions', 'user'],
  });

  const { data: tradingAccounts = [] } = useQuery<AccountWithStats[]>({
    queryKey: ['/api/trading-accounts'],
  });

  const allEmotions = [...emotions, ...userEmotions];

  // Helper function for ticker colors - Moved before use
  const getTickerTypeColor = (type: string) => {
    switch (type) {
      case 'stock': return 'bg-blue-500';
      case 'forex': return 'bg-green-500';
      case 'crypto': return 'bg-orange-500';
      case 'futures': return 'bg-purple-500';
      case 'commodity': return 'bg-yellow-500';
      case 'indices': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  // Expanded ticker list
  const popularTickers = [
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
    { symbol: 'LMND', name: 'Lemonade Inc.', type: 'stock' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock' },
    { symbol: 'EURUSD', name: 'Euro/US Dollar', type: 'forex' },
    { symbol: 'GBPUSD', name: 'British Pound/US Dollar', type: 'forex' },
    { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen', type: 'forex' },
    { symbol: 'BTCUSD', name: 'Bitcoin/US Dollar', type: 'crypto' },
    { symbol: 'ETHUSD', name: 'Ethereum/US Dollar', type: 'crypto' },
    { symbol: 'ES1!', name: 'E-mini S&P 500', type: 'futures' },
    { symbol: 'NQ1!', name: 'E-mini NASDAQ 100', type: 'futures' },
  ];

  const filteredTickers = instrumentSearch.length > 1 
    ? popularTickers.filter(ticker => 
        ticker.symbol.toLowerCase().includes(instrumentSearch.toLowerCase()) ||
        ticker.name.toLowerCase().includes(instrumentSearch.toLowerCase())
      )
    : popularTickers; // Mostrar todos los tickers populares por defecto

  // Define carousel steps
  const steps: CarouselStep[] = [
    {
      id: 'account',
      title: 'Trading Account',
      description: 'Select the account where you made this trade',
      icon: <Wallet className="h-6 w-6" />,
      isOptional: false,
      component: (
        <div className="space-y-4">
          <Select 
            value={form.watch('accountId') || 'default'} 
            onValueChange={(value) => form.setValue('accountId', value === 'default' ? '' : value)}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white" data-testid="carousel-select-trading-account">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="default" className="text-white hover:bg-gray-700">
                Default - $0
              </SelectItem>
              {tradingAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id} className="text-white hover:bg-gray-700">
                  {account.name} - ${parseFloat(account.currentCapital.toString()).toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    },
    {
      id: 'instrument',
      title: 'The Ticker',
      description: 'What instrument did you trade?',
      icon: <Target className="h-6 w-6" />,
      isOptional: false,
      component: (
        <div className="space-y-4">
          <Popover open={instrumentSearchOpen} onOpenChange={setInstrumentSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={instrumentSearchOpen}
                className="w-full justify-between bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                data-testid="carousel-select-instrument"
              >
                {form.watch('customInstrument') || form.watch('instrumentId') 
                  ? (() => {
                      const customSymbol = form.watch('customInstrument');
                      if (customSymbol) return customSymbol;
                      const selected = instruments.find(i => i.id === form.watch('instrumentId'));
                      return selected ? `${selected.symbol} - ${selected.name}` : "Search instrument...";
                    })()
                  : "Search or type ticker..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0 bg-gray-800 border-gray-600">
              <Command className="bg-gray-800">
                <CommandInput 
                  placeholder="Search ticker (e.g.: LMND, AAPL, NQ, EURUSD, XRP)..." 
                  value={instrumentSearch}
                  onValueChange={(value) => {
                    setInstrumentSearch(value);
                    setCustomTicker(value);
                  }}
                  className="bg-gray-800 border-gray-600 text-white"
                />
                <div className="px-2 py-1 text-xs text-gray-400 border-b border-gray-600">
                  💡 Write any ticker & press Enter to use it as a custom one
                </div>
                <CommandList className="max-h-[300px] overflow-y-auto">
                  <CommandEmpty className="text-gray-400 p-4">
                    <div className="text-center">
                      <div>Results for "{instrumentSearch}"</div>
                      <div className="text-xs mt-1">Press Enter to use as custom ticker</div>
                    </div>
                  </CommandEmpty>
                  
                  {filteredTickers.length > 0 && (
                    <CommandGroup heading="Popular">
                      {filteredTickers.map((ticker) => (
                        <CommandItem
                          key={ticker.symbol}
                          value={ticker.symbol}
                          onSelect={(currentValue) => {
                            form.setValue('customInstrument', currentValue.toUpperCase());
                            form.setValue('instrumentId', undefined);
                            setInstrumentSearchOpen(false);
                            setInstrumentSearch(currentValue.toUpperCase());
                          }}
                          className="flex items-center space-x-2 hover:bg-gray-700 text-white cursor-pointer"
                        >
                          <div className={`w-2 h-2 rounded-full ${getTickerTypeColor(ticker.type)}`}></div>
                          <span className="font-mono font-bold">{ticker.symbol}</span>
                          <span className="text-gray-400 text-sm">{ticker.name}</span>
                          <Check
                            className={`ml-auto h-4 w-4 ${
                              form.watch('customInstrument') === ticker.symbol ? "opacity-100" : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )
    },
    {
      id: 'direction',
      title: 'Direction',
      description: 'Did you go short or long?',
      icon: <Activity className="h-6 w-6" />,
      isOptional: false,
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={form.watch('direction') === 'long' ? "default" : "outline"}
              onClick={() => form.setValue('direction', 'long')}
              className={`h-16 flex flex-col items-center justify-center space-y-2 ${
                form.watch('direction') === 'long' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
              }`}
              data-testid="carousel-direction-long"
            >
              <TrendingUp className="h-6 w-6" />
              <span>Long</span>
            </Button>
            <Button
              variant={form.watch('direction') === 'short' ? "default" : "outline"}
              onClick={() => form.setValue('direction', 'short')}
              className={`h-16 flex flex-col items-center justify-center space-y-2 ${
                form.watch('direction') === 'short' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
              }`}
              data-testid="carousel-direction-short"
            >
              <TrendingDown className="h-6 w-6" />
              <span>Short</span>
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'entry-price',
      title: 'Entry price',
      description: 'Which was your entry price?',
      icon: <DollarSign className="h-6 w-6" />,
      isOptional: true,
      component: (
        <div className="space-y-4">
          <Input
            placeholder="Ej: 150.50"
            value={form.watch('entryPrice') || ''}
            onChange={(e) => form.setValue('entryPrice', e.target.value)}
            className="bg-gray-800 border-gray-600 text-white text-xl text-center h-16"
            data-testid="carousel-entry-price"
          />
          <p className="text-sm text-gray-400 text-center">
            Leave empty if you don't want to specify
          </p>
        </div>
      )
    },
    {
      id: 'exit-price',
      title: 'Exit Price',
      description: 'Which was your exit price?',
      icon: <DollarSign className="h-6 w-6" />,
      isOptional: true,
      component: (
        <div className="space-y-4">
          <Input
            placeholder="Ej: 155.25"
            value={form.watch('exitPrice') || ''}
            onChange={(e) => form.setValue('exitPrice', e.target.value)}
            className="bg-gray-800 border-gray-600 text-white text-xl text-center h-16"
            data-testid="carousel-exit-price"
          />
          <p className="text-sm text-gray-400 text-center">
            Leave empty if the trade is still open
          </p>
        </div>
      )
    },
    {
      id: 'pnl',
      title: 'Final P&L',
      description: 'Did you lose or bank from the trade?',
      icon: <Calculator className="h-6 w-6" />,
      isOptional: true,
      component: (
        <div className="space-y-4">
          <Input
            placeholder="Ej: +250.00 o -150.00"
            value={form.watch('customPnl') || ''}
            onChange={(e) => form.setValue('customPnl', e.target.value)}
            className="bg-gray-800 border-gray-600 text-white text-xl text-center h-16"
            data-testid="carousel-pnl"
          />
          <p className="text-sm text-gray-400 text-center">
            Use - for losses. Remember to be real with yourself.
          </p>
        </div>
      )
    },
    {
      id: 'lot-size',
      title: 'Position Size',
      description: 'Which was the position Size?',
      icon: <Activity className="h-6 w-6" />,
      isOptional: false,
      component: (
        <div className="space-y-4">
          <Input
            placeholder="Ej: 100"
            value={form.watch('lotSize') || ''}
            onChange={(e) => form.setValue('lotSize', e.target.value)}
            className="bg-gray-800 border-gray-600 text-white text-xl text-center h-16"
            data-testid="carousel-lot-size"
          />
          <p className="text-sm text-gray-400 text-center">
            Shares Quant, lots, or contracts.
          </p>
        </div>
      )
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'You want to add a note about the trade?',
      icon: <Search className="h-6 w-6" />,
      isOptional: true,
      component: (
        <div className="space-y-4">
          <Textarea
            placeholder="Ex: Standard Deviation Hit..."
            value={form.watch('notes') || ''}
            onChange={(e) => form.setValue('notes', e.target.value)}
            className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
            data-testid="carousel-notes"
          />
        </div>
      )
    },
    {
      id: 'screenshot',
      title: 'Trade Screenshot',
      description: 'You want to add an image?',
      icon: <Camera className="h-6 w-6" />,
      isOptional: true,
      component: (
        <div className="space-y-4">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Trade screenshot" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={removeImage}
                className="absolute top-2 right-2"
                data-testid="carousel-remove-image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
              data-testid="carousel-upload-image"
            >
              <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-400">Click to upload image</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      )
    },
    {
      id: 'emotions',
      title: 'Emotions',
      description: '¿How did you feel during the trade?',
      icon: <Heart className="h-6 w-6" />,
      isOptional: true,
      component: (
        <div className="space-y-4">
          <Popover open={emotionDropdownOpen} onOpenChange={setEmotionDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                data-testid="carousel-select-emotions"
              >
                Select emotions
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-gray-800 border-gray-600">
              <Command className="bg-gray-800">
                <CommandInput 
                  placeholder="Search emotions..." 
                  className="bg-gray-800 border-gray-600 text-white"
                />
                <CommandList className="max-h-[200px] overflow-y-auto">
                  <CommandEmpty className="text-gray-400 p-4">We couldn't find that emotion. Add it.</CommandEmpty>
                  <CommandGroup>
                    {allEmotions.map((emotion) => {
                      const IconComponent = getIconByName(emotion.icon);
                      return (
                        <CommandItem
                          key={emotion.id}
                          value={emotion.name}
                          onSelect={() => addEmotion(emotion)}
                          className="flex items-center space-x-2 hover:bg-gray-700 text-white cursor-pointer"
                        >
                          <IconComponent className="h-4 w-4" />
                          <span>{emotion.name}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedEmotions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedEmotions.map((emotion) => {
                const IconComponent = getIconByName(emotion.icon);
                return (
                  <div key={emotion.id} className="flex items-center space-x-1 bg-gray-700 px-2 py-1 rounded-md">
                    <IconComponent className="h-4 w-4" />
                    <span className="text-sm">{emotion.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmotion(emotion.id)}
                      className="h-4 w-4 p-0 hover:bg-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'datetime',
      title: 'Date & Time',
      description: 'When was this trade placed?',
      icon: <Clock className="h-6 w-6" />,
      isOptional: true,
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-200">Entry date</Label>
              <Input
                type="date"
                value={form.watch('entryDate') || ''}
                onChange={(e) => form.setValue('entryDate', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                data-testid="carousel-entry-date"
              />
            </div>
            <div>
              <Label className="text-gray-200">Entry time</Label>
              <Input
                type="time"
                value={form.watch('entryTime') || ''}
                onChange={(e) => form.setValue('entryTime', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                data-testid="carousel-entry-time"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-200">Exit date (optional)</Label>
              <Input
                type="date"
                value={form.watch('exitDate') || ''}
                onChange={(e) => form.setValue('exitDate', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                data-testid="carousel-exit-date"
              />
            </div>
            <div>
              <Label className="text-gray-200">Exit time (optional)</Label>
              <Input
                type="time"
                value={form.watch('exitTime') || ''}
                onChange={(e) => form.setValue('exitTime', e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                data-testid="carousel-exit-time"
              />
            </div>
          </div>
        </div>
      )
    }
  ];


  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set(Array.from(prev).concat([currentStep])));
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    if (steps[currentStep].isOptional) {
      goToNextStep();
    }
  };


  const addEmotion = (emotion: Emotion) => {
    if (!selectedEmotions.find(e => e.id === emotion.id)) {
      setSelectedEmotions(prev => [...prev, emotion]);
    }
    setEmotionDropdownOpen(false);
  };

  const removeEmotion = (emotionId: string) => {
    setSelectedEmotions(prev => prev.filter(e => e.id !== emotionId));
  };

  const canProceed = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'account':
        return true; // Account is optional (can use default)
      case 'instrument':
        return form.watch('instrumentId') || form.watch('customInstrument');
      case 'direction':
        return form.watch('direction');
      case 'lot-size':
        return form.watch('lotSize');
      default:
        return true; // Optional steps can always proceed
    }
  };

  // Additional helper functions

  // Trade mutation
  const tradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      const entryDateTime = data.entryDate && data.entryTime 
        ? `${data.entryDate}T${data.entryTime}` 
        : data.entryDateTime;
      const exitDateTime = data.exitDate && data.exitTime 
        ? `${data.exitDate}T${data.exitTime}` 
        : data.exitDateTime;

      const payload = {
        accountId: data.accountId,
        instrumentId: data.instrumentId,
        customInstrument: data.customInstrument,
        direction: data.direction,
        entryPrice: data.entryPrice ? parseFloat(data.entryPrice).toString() : undefined,
        exitPrice: data.exitPrice ? parseFloat(data.exitPrice).toString() : undefined,
        customPnl: data.customPnl ? parseFloat(data.customPnl).toString() : undefined,
        lotSize: Math.max(1, parseInt(data.lotSize) || 1),
        notes: data.notes || undefined,
        tradeType: data.tradeType || undefined,
        entryTime: entryDateTime || undefined,
        exitTime: exitDateTime || undefined,
        imageUrl: imagePreview || undefined,
      };
      
      let response;
      let result;
      
      if (trade) {
        response = await apiRequest('PUT', `/api/trades/${trade.id}`, payload);
        result = await response.json();
      } else {
        response = await apiRequest('POST', '/api/trades', payload);
        result = await response.json();
      }
      
      // Create emotion logs if any emotions were selected
      if (selectedEmotions.length > 0) {
        const tradeId = trade?.id || result.id;
        for (const emotion of selectedEmotions) {
          try {
            await apiRequest('POST', '/api/emotion-logs', {
              tradeId: tradeId,
              emotionId: emotion.id,
              intensity: 5,
            });
          } catch (emotionError) {
            console.warn('Failed to create emotion log:', emotionError);
          }
        }
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: trade ? "Trade updated successfully" : "Trade created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trading-accounts'] });
      if (trade) {
        queryClient.invalidateQueries({ queryKey: ['/api/trades', trade.id] });
      }
      onOpenChange(false);
      // Reset form and state
      form.reset();
      setCurrentStep(0);
      setCompletedSteps(new Set());
      setImagePreview(null);
      setSelectedEmotions([]);
    },
    onError: (error) => {
      console.error("Trade mutation error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Not authorized",
          description: "Your session has expired. Login in...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error",
        description: trade ? `We couldn't update the trade: ${errorMessage}` : `We couldn't set the trade: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const data = form.getValues() as TradeFormData;
    tradeMutation.mutate(data);
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open && !trade) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
      form.reset({
        direction: 'long',
        lotSize: '1',
      });
      setImagePreview(null);
      setSelectedEmotions([]);
    }
  }, [open, trade, form]);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-gray-900/95 border border-gray-700/50 text-white backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            {currentStepData.icon}
            <span className="ml-2">{trade ? 'Edit Trade' : 'New Trade'}</span>
          </DialogTitle>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Paso {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
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
                <h3 className="text-xl font-semibold text-white mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-400">
                  {currentStepData.description}
                </p>
              </div>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  {currentStepData.component}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              data-testid="carousel-previous-step"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex space-x-2">
              {currentStepData.isOptional && !isLastStep && (
                <Button
                  variant="ghost"
                  onClick={skipStep}
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                  data-testid="carousel-skip-step"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
              )}

              {isLastStep ? (
                <Button
                  onClick={handleSubmit}
                  disabled={tradeMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  data-testid="carousel-submit-trade"
                >
                  {tradeMutation.isPending ? "Saving..." : (trade ? "Update Trade" : "Create Trade")}
                </Button>
              ) : (
                <Button
                  onClick={goToNextStep}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  data-testid="carousel-next-step"
                >
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}