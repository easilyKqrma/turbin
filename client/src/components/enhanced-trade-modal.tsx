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
import { Switch } from "@/components/ui/switch";
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
  Wallet, Settings 
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
  entryPrice: z.string().optional().or(z.literal('')),
  exitPrice: z.string().optional().or(z.literal('')),
  lotSize: z.string().min(1, "Lot size is required"),
  pnl: z.string().optional().or(z.literal('')),
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
});

type TradeFormData = z.infer<typeof tradeSchema>;

interface EnhancedTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade?: any; // Optional trade for editing
}

export default function EnhancedTradeModal({ open, onOpenChange, trade }: EnhancedTradeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [showPriceFields, setShowPriceFields] = useState(false);
  const [showPnlField, setShowPnlField] = useState(false);
  const [showEmotionField, setShowEmotionField] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showDateTime, setShowDateTime] = useState(false);
  const [showTradeType, setShowTradeType] = useState(false);
  const [overrideTradeType, setOverrideTradeType] = useState(false);
  
  // Search states
  const [instrumentSearchOpen, setInstrumentSearchOpen] = useState(false);
  const [instrumentSearch, setInstrumentSearch] = useState("");
  const [customTicker, setCustomTicker] = useState("");
  
  // Other states
  const [calculatedResult, setCalculatedResult] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [emotionDropdownOpen, setEmotionDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      direction: 'long',
      lotSize: '1',
    },
  });

  // Queries - moved before useEffect to avoid "used before declaration" error
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

  // Populate form when editing trade
  useEffect(() => {
    if (trade && open) {
      console.log('Populating form with trade data:', trade);
      form.reset({
        accountId: trade.accountId || '',
        instrumentId: trade.instrumentId || '',
        customInstrument: trade.customInstrument || '',
        direction: trade.direction || 'long',
        entryPrice: trade.entryPrice?.toString() || '',
        exitPrice: trade.exitPrice?.toString() || '',
        pnl: trade.pnl?.toString() || '',
        lotSize: trade.lotSize?.toString() || '1',
        notes: trade.notes || '',
        tradeType: trade.tradeType || '',
        entryDateTime: trade.entryTime ? new Date(trade.entryTime).toISOString().slice(0, 16) : '',
        exitDateTime: trade.exitTime ? new Date(trade.exitTime).toISOString().slice(0, 16) : '',
      });
      
      // Set preview image if available
      if (trade.imageUrl) {
        setImagePreview(trade.imageUrl);
      }

      // Show appropriate sections based on existing data
      if (trade.entryPrice || trade.exitPrice) {
        setShowPriceFields(true);
      }
      if (trade.pnl) {
        setShowPnlField(true);
      }
      if (trade.entryTime || trade.exitTime) {
        setShowDateTime(true);
      }
      if (trade.imageUrl) {
        setShowScreenshot(true);
      }
      if (trade.tradeType) {
        setShowTradeType(true);
      }
    } else if (!trade && open) {
      // Reset form for new trade
      form.reset({
        direction: 'long',
        lotSize: '1',
      });
      setImagePreview(null);
      setShowPriceFields(false);
      setShowPnlField(false);
      setShowDateTime(false);
      setShowScreenshot(false);
      setShowTradeType(false);
      setSelectedEmotions([]);
    }
  }, [trade, open, form]);

  // Combine default and user emotions
  const allEmotions = [...emotions, ...userEmotions];

  // Expanded ticker list with more stocks and markets
  const popularTickers = [
    // Stocks
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
    { symbol: 'LMND', name: 'Lemonade Inc.', type: 'stock' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock' },
    { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock' },
    { symbol: 'PYPL', name: 'PayPal Holdings Inc.', type: 'stock' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'stock' },
    // Forex
    { symbol: 'EURUSD', name: 'Euro/US Dollar', type: 'forex' },
    { symbol: 'GBPUSD', name: 'British Pound/US Dollar', type: 'forex' },
    { symbol: 'USDJPY', name: 'US Dollar/Japanese Yen', type: 'forex' },
    { symbol: 'USDCHF', name: 'US Dollar/Swiss Franc', type: 'forex' },
    { symbol: 'AUDUSD', name: 'Australian Dollar/US Dollar', type: 'forex' },
    { symbol: 'USDCAD', name: 'US Dollar/Canadian Dollar', type: 'forex' },
    { symbol: 'NZDUSD', name: 'New Zealand Dollar/US Dollar', type: 'forex' },
    // Crypto
    { symbol: 'BTCUSD', name: 'Bitcoin/US Dollar', type: 'crypto' },
    { symbol: 'ETHUSD', name: 'Ethereum/US Dollar', type: 'crypto' },
    { symbol: 'ADAUSD', name: 'Cardano/US Dollar', type: 'crypto' },
    { symbol: 'SOLUSD', name: 'Solana/US Dollar', type: 'crypto' },
    { symbol: 'DOTUSD', name: 'Polkadot/US Dollar', type: 'crypto' },
    { symbol: 'LINKUSD', name: 'Chainlink/US Dollar', type: 'crypto' },
    // Futures
    { symbol: 'ES1!', name: 'E-mini S&P 500', type: 'futures' },
    { symbol: 'NQ1!', name: 'E-mini NASDAQ 100', type: 'futures' },
    { symbol: 'YM1!', name: 'E-mini Dow Jones', type: 'futures' },
    { symbol: 'RTY1!', name: 'E-mini Russell 2000', type: 'futures' },
    { symbol: 'GC1!', name: 'Gold Futures', type: 'futures' },
    { symbol: 'SI1!', name: 'Silver Futures', type: 'futures' },
    { symbol: 'CL1!', name: 'Crude Oil Futures', type: 'futures' },
    { symbol: 'NG1!', name: 'Natural Gas Futures', type: 'futures' },
    // Commodities
    { symbol: 'XAUUSD', name: 'Gold/US Dollar', type: 'commodity' },
    { symbol: 'XAGUSD', name: 'Silver/US Dollar', type: 'commodity' },
    // Indices
    { symbol: 'SPX', name: 'S&P 500 Index', type: 'indices' },
    { symbol: 'NDX', name: 'NASDAQ 100 Index', type: 'indices' },
    { symbol: 'DJI', name: 'Dow Jones Industrial Average', type: 'indices' },
  ];

  // Filter instruments based on search
  const filteredTickers = instrumentSearch.length > 1 
    ? popularTickers.filter(ticker => 
        ticker.symbol.toLowerCase().includes(instrumentSearch.toLowerCase()) ||
        ticker.name.toLowerCase().includes(instrumentSearch.toLowerCase())
      )
    : [];

  // Calculate trade result automatically
  useEffect(() => {
    const entryPrice = form.watch('entryPrice');
    const exitPrice = form.watch('exitPrice');
    const direction = form.watch('direction');

    if (entryPrice && exitPrice && showPriceFields) {
      const entry = parseFloat(entryPrice);
      const exit = parseFloat(exitPrice);
      
      if (!isNaN(entry) && !isNaN(exit)) {
        if (Math.abs(exit - entry) < 0.001) {
          setCalculatedResult('breakeven');
        } else {
          const isProfit = direction === 'long' ? exit > entry : entry > exit;
          setCalculatedResult(isProfit ? 'profit' : 'loss');
        }
      } else {
        setCalculatedResult(null);
      }
    } else {
      setCalculatedResult(null);
    }
  }, [form.watch, showPriceFields]);

  // Auto-calculate trade type based on entry/exit times
  useEffect(() => {
    if (!overrideTradeType && showDateTime && showTradeType) {
      const entryDate = form.watch('entryDate');
      const entryTime = form.watch('entryTime');
      const exitDate = form.watch('exitDate');
      const exitTime = form.watch('exitTime');

      if (entryDate && entryTime && exitDate && exitTime) {
        const entryDateTime = new Date(`${entryDate}T${entryTime}`);
        const exitDateTime = new Date(`${exitDate}T${exitTime}`);
        
        if (!isNaN(entryDateTime.getTime()) && !isNaN(exitDateTime.getTime())) {
          const diffMs = exitDateTime.getTime() - entryDateTime.getTime();
          const diffMinutes = Math.abs(diffMs) / (1000 * 60);
          const diffHours = diffMinutes / 60;
          const diffDays = diffHours / 24;

          // Check if same day
          const sameDay = entryDate === exitDate;

          let tradeType: 'scalp' | 'day' | 'swing';
          
          if (diffMinutes < 60) {
            // Less than 1 hour = Scalp
            tradeType = 'scalp';
          } else if (sameDay && diffHours < 24) {
            // Same day, more than 1 hour = Day trade
            tradeType = 'day';
          } else {
            // Different days = Swing trade
            tradeType = 'swing';
          }

          form.setValue('tradeType', tradeType);
        }
      }
    }
  }, [form.watch, overrideTradeType, showDateTime, showTradeType]);

  // Handle image upload
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

  // Handle custom ticker input
  const handleTickerKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      if (customTicker.trim()) {
        form.setValue('customInstrument', customTicker.toUpperCase());
        form.setValue('instrumentId', undefined);
        setInstrumentSearchOpen(false);
        setInstrumentSearch(customTicker.toUpperCase());
      }
    }
  };

  const handleTickerBlur = () => {
    if (customTicker.trim()) {
      form.setValue('customInstrument', customTicker.toUpperCase());
      form.setValue('instrumentId', undefined);
      setInstrumentSearchOpen(false);
      setInstrumentSearch(customTicker.toUpperCase());
    }
  };

  // Handle multiple emotions
  const addEmotion = (emotion: Emotion) => {
    if (!selectedEmotions.find(e => e.id === emotion.id)) {
      setSelectedEmotions(prev => [...prev, emotion]);
    }
    setEmotionDropdownOpen(false);
  };

  const removeEmotion = (emotionId: string) => {
    setSelectedEmotions(prev => prev.filter(e => e.id !== emotionId));
  };

  const tradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      console.log('Mutation started with data:', data);
      console.log('Trade object:', trade);
      console.log('Is editing?', !!trade);
      
      // Combine separate date and time fields into datetime strings if provided
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
        customPnl: data.pnl ? parseFloat(data.pnl).toString() : undefined,
        lotSize: Math.max(1, parseInt(data.lotSize) || 1),
        notes: data.notes || undefined,
        tradeType: data.tradeType || undefined,
        // Send datetime strings directly - server will handle conversion
        entryTime: entryDateTime || undefined,
        exitTime: exitDateTime || undefined,
        // Include the image as base64 if available
        imageUrl: imagePreview || undefined,
        // Send manual P&L preference to prevent automatic calculation
        useManualPnl: showPnlField,
      };
      
      let response;
      let result;
      
      if (trade) {
        // Update existing trade
        console.log('Sending PUT request to:', `/api/trades/${trade.id}`);
        console.log('Payload:', payload);
        response = await apiRequest('PUT', `/api/trades/${trade.id}`, payload);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('PUT request failed:', response.status, errorText);
          throw new Error(`Update failed: ${response.status} ${errorText}`);
        }
        result = await response.json();
        console.log('Update result:', result);
      } else {
        // Create new trade
        response = await apiRequest('POST', '/api/trades', payload);
        result = await response.json();
      }
      
      // If trade was created/updated successfully and we have emotions, create emotion logs
      if (selectedEmotions.length > 0) {
        const tradeId = trade?.id || result.id; // Use the newly created trade ID if creating, or existing ID if updating
        for (const emotion of selectedEmotions) {
          try {
            await apiRequest('POST', '/api/emotion-logs', {
              tradeId: tradeId,
              emotionId: emotion.id,
              intensity: 5, // Default intensity
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
        title: "Success",
        description: trade ? "Trade updated successfully" : "Trade created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trading-accounts'] });
      if (trade) {
        // Invalidate specific trade query if editing
        queryClient.invalidateQueries({ queryKey: ['/api/trades', trade.id] });
      }
      onOpenChange(false);
      form.reset();
      setCalculatedResult(null);
      setImagePreview(null);
      setShowPriceFields(false);
      setShowPnlField(false);
      setShowEmotionField(false);
      setShowScreenshot(false);
      setSelectedEmotions([]);
    },
    onError: (error) => {
      console.error("Trade mutation error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Your session has expired. Logging in...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Error",
        description: trade ? `Could not update trade: ${errorMessage}` : `Could not create trade: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: TradeFormData) => {
    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('Form submitted with data:', data);
    console.log('Trade being edited:', trade);
    console.log('Form errors:', form.formState.errors);
    console.log('Form is valid:', form.formState.isValid);
    console.log('Form state:', form.formState);
    
    // Check if mutation is already pending
    if (tradeMutation.isPending) {
      console.log('Mutation already pending, skipping');
      return;
    }
    
    console.log('Starting mutation...');
    tradeMutation.mutate(data);
  };

  // Get ticker color by type
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

  const getResultColor = (result: string) => {
    switch (result) {
      case 'profit': return 'text-green-400';
      case 'loss': return 'text-red-400';
      case 'breakeven': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-gray-900/95 border border-gray-700/50 text-white backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Calculator className="h-6 w-6 mr-2 text-blue-400" />
            {trade ? 'Edit Trade' : 'New Trade Entry'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Trading Account Selection */}
          <div className="space-y-2">
            <Label className="text-gray-200 flex items-center">
              <Wallet className="h-4 w-4 mr-2" />
              Trading Account
            </Label>
            <Select 
              value={form.watch('accountId') || 'default'} 
              onValueChange={(value) => form.setValue('accountId', value === 'default' ? '' : value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white" data-testid="select-trading-account">
                <SelectValue placeholder="Default" />
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
            {form.formState.errors.accountId && (
              <p className="text-sm text-red-400">
                {form.formState.errors.accountId.message}
              </p>
            )}
          </div>

          {/* Instrument Selection */}
          <div className="space-y-2">
            <Label className="text-gray-200">Instrument / Ticker</Label>
            <Popover open={instrumentSearchOpen} onOpenChange={setInstrumentSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={instrumentSearchOpen}
                  className="w-full justify-between bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  data-testid="select-instrument"
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
                    placeholder="Search ticker (e.g: LMND, AAPL, EURUSD)..." 
                    value={instrumentSearch}
                    onValueChange={(value) => {
                      setInstrumentSearch(value);
                      setCustomTicker(value);
                    }}
                    onKeyDown={handleTickerKeyDown}
                    onBlur={handleTickerBlur}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  <div className="px-2 py-1 text-xs text-gray-400 border-b border-gray-600">
                    💡 Type any ticker and press Enter to use a custom one
                  </div>
                  <CommandList className="max-h-[300px] overflow-y-auto">
                    <CommandEmpty className="text-gray-400 p-4">
                      <div className="text-center">
                        <div>No results for &quot;{instrumentSearch}&quot;</div>
                        <div className="text-xs mt-1">Press Enter to use as custom ticker</div>
                      </div>
                    </CommandEmpty>
                    
                    {instruments.length > 0 && (
                      <CommandGroup heading="Available Instruments">
                        {instruments.map((instrument) => (
                          <CommandItem
                            key={instrument.id}
                            value={`${instrument.symbol} ${instrument.name}`}
                            onSelect={() => {
                              form.setValue('instrumentId', instrument.id);
                              form.setValue('customInstrument', undefined);
                              setInstrumentSearchOpen(false);
                            }}
                            className="text-white hover:bg-gray-700"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                form.watch('instrumentId') === instrument.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-gray-500" />
                              <div className="flex flex-col">
                                <span className="font-medium">{instrument.symbol}</span>
                                <span className="text-xs text-gray-400">{instrument.name}</span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    
                    {filteredTickers.length > 0 && (
                      <CommandGroup heading="Popular Tickers">
                        {filteredTickers.map((ticker) => (
                          <CommandItem
                            key={ticker.symbol}
                            value={`${ticker.symbol} ${ticker.name}`}
                            onSelect={() => {
                              form.setValue('customInstrument', ticker.symbol);
                              form.setValue('instrumentId', undefined);
                              setInstrumentSearchOpen(false);
                            }}
                            className="text-white hover:bg-gray-700"
                          >
                            <div className="flex items-center space-x-2 w-full">
                              <div className={`w-2 h-2 rounded-full ${getTickerTypeColor(ticker.type)}`} />
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{ticker.symbol}</span>
                                  <span className="text-xs text-gray-500 uppercase">{ticker.type}</span>
                                </div>
                                <span className="text-xs text-gray-400">{ticker.name}</span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.customInstrument && (
              <p className="text-sm text-red-400">
                {form.formState.errors.customInstrument.message}
              </p>
            )}
          </div>

          {/* Direction */}
          <div className="space-y-2">
            <Label className="text-gray-200">Direction</Label>
            <div className="flex space-x-2">
              <Button 
                type="button"
                variant={form.watch('direction') === 'long' ? 'default' : 'outline'}
                onClick={() => form.setValue('direction', 'long')}
                className={form.watch('direction') === 'long' ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-600 text-green-400 hover:bg-green-600/20'}
                data-testid="button-long"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Long
              </Button>
              <Button 
                type="button"
                variant={form.watch('direction') === 'short' ? 'default' : 'outline'}
                onClick={() => form.setValue('direction', 'short')}
                className={form.watch('direction') === 'short' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-600 text-red-400 hover:bg-red-600/20'}
                data-testid="button-short"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Short
              </Button>
            </div>
          </div>

          {/* Lot Size */}
          <div className="space-y-2">
            <Label htmlFor="lotSize" className="text-gray-200">Lot Size / Contracts</Label>
            <Input
              id="lotSize"
              type="number"
              placeholder="1"
              {...form.register('lotSize')}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              data-testid="input-lot-size"
            />
            {form.formState.errors.lotSize && (
              <p className="text-sm text-red-400">
                {form.formState.errors.lotSize.message}
              </p>
            )}
          </div>

          {/* Optional Fields Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h3 className="col-span-full text-lg font-medium text-gray-200 mb-2 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Optional Fields
            </h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="price-toggle" className="text-gray-300">Entry/Exit Prices</Label>
              <Switch
                id="price-toggle"
                checked={showPriceFields}
                onCheckedChange={setShowPriceFields}
                data-testid="toggle-price-fields"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pnl-toggle" className="text-gray-300">Manual P&L</Label>
              <Switch
                id="pnl-toggle"
                checked={showPnlField}
                onCheckedChange={setShowPnlField}
                data-testid="toggle-pnl-field"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="emotion-toggle" className="text-gray-300">Trade Emotion</Label>
              <Switch
                id="emotion-toggle"
                checked={showEmotionField}
                onCheckedChange={setShowEmotionField}
                data-testid="toggle-emotion-field"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="screenshot-toggle" className="text-gray-300">Trade Screenshot</Label>
              <Switch
                id="screenshot-toggle"
                checked={showScreenshot}
                onCheckedChange={setShowScreenshot}
                data-testid="toggle-screenshot-field"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="datetime-toggle" className="text-gray-300">Entry/Exit Date & Time</Label>
              <Switch
                id="datetime-toggle"
                checked={showDateTime}
                onCheckedChange={setShowDateTime}
                data-testid="toggle-datetime-field"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="tradetype-toggle" className="text-gray-300">Trade Type</Label>
              <Switch
                id="tradetype-toggle"
                checked={showTradeType}
                onCheckedChange={setShowTradeType}
                disabled={!showDateTime}
                data-testid="toggle-tradetype-field"
              />
            </div>
          </div>

          {/* Price Fields */}
          <AnimatePresence>
            {showPriceFields && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div>
                    <Label htmlFor="entryPrice" className="text-gray-200">Entry Price</Label>
                    <Input
                      id="entryPrice"
                      type="number"
                      step="0.00001"
                      placeholder="25.620"
                      {...form.register('entryPrice')}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                      data-testid="input-entry-price"
                    />
                  </div>

                  <div>
                    <Label htmlFor="exitPrice" className="text-gray-200">Exit Price</Label>
                    <Input
                      id="exitPrice"
                      type="number"
                      step="0.00001"
                      placeholder="25.625"
                      {...form.register('exitPrice')}
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
                      data-testid="input-exit-price"
                    />
                  </div>

                  {calculatedResult && (
                    <div className="col-span-full">
                      <Card className="bg-gray-800/50 border-gray-600">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">Trade Status:</span>
                            <span className={`font-bold uppercase ${getResultColor(calculatedResult)}`}>
                              {calculatedResult === 'profit' && '✅ PROFIT'}
                              {calculatedResult === 'loss' && '❌ LOSS'} 
                              {calculatedResult === 'breakeven' && '🔄 BREAKEVEN'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom P&L Field */}
          <AnimatePresence>
            {showPnlField && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <Label htmlFor="pnl" className="text-gray-200 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Profit/Loss ($)
                  </Label>
                  <Input
                    id="pnl"
                    type="number"
                    step="0.01"
                    placeholder="150.75 (positive = profit, negative = loss)"
                    {...form.register('pnl')}
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 mt-2"
                    data-testid="input-pnl"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter positive values for profits and negative for losses
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multiple Emotions Selection */}
          <AnimatePresence>
            {showEmotionField && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <Label className="text-gray-200 flex items-center mb-3">
                    <Heart className="h-4 w-4 mr-2" />
                    Trade Emotions
                  </Label>
                  
                  {/* Selected Emotions Display */}
                  {selectedEmotions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-2">Selected emotions:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmotions.map((emotion) => {
                          const IconComponent = getIconByName(emotion.icon);
                          return (
                            <div
                              key={emotion.id}
                              className="flex items-center space-x-1 bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 text-sm"
                            >
                              <IconComponent className="h-3 w-3" />
                              <span className="text-gray-200">{emotion.name}</span>
                              <button
                                type="button"
                                onClick={() => removeEmotion(emotion.id)}
                                className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
                                data-testid={`remove-emotion-${emotion.name.toLowerCase()}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Add Emotion Dropdown */}
                  <Popover open={emotionDropdownOpen} onOpenChange={setEmotionDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                        data-testid="add-emotion-button"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        {selectedEmotions.length === 0 ? "How did you feel during this trade?" : "Add another emotion"}
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0 bg-gray-800 border-gray-600">
                      <Command className="bg-gray-800">
                        <CommandInput 
                          placeholder="Search emotions..." 
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                        <CommandList className="max-h-[200px] overflow-y-auto">
                          <CommandEmpty className="text-gray-400 p-4 text-center">
                            No emotions found.
                          </CommandEmpty>
                          <CommandGroup>
                            {allEmotions
                              .filter(emotion => !selectedEmotions.find(e => e.id === emotion.id))
                              .map((emotion) => {
                                const IconComponent = getIconByName(emotion.icon);
                                return (
                                  <CommandItem
                                    key={emotion.id}
                                    onSelect={() => addEmotion(emotion)}
                                    className="text-white hover:bg-gray-700 cursor-pointer"
                                    data-testid={`emotion-option-${emotion.name.toLowerCase()}`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <IconComponent className="h-4 w-4" />
                                      <span>{emotion.name}</span>
                                      <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                                        emotion.category === 'positive' ? 'bg-green-500/20 text-green-400' :
                                        emotion.category === 'negative' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-400'
                                      }`}>
                                        {emotion.category}
                                      </span>
                                    </div>
                                  </CommandItem>
                                );
                              })
                            }
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {selectedEmotions.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      💡 You can add multiple emotions to better track your trading psychology
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Screenshot Upload */}
          <AnimatePresence>
            {showScreenshot && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <Label className="text-gray-200 flex items-center mb-2">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Trade Screenshot
                  </Label>
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Trade preview" 
                        className="max-w-full h-40 object-cover rounded-lg border border-gray-600"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white"
                        data-testid="button-remove-image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-gray-500 hover:bg-gray-800/50 transition-colors"
                      data-testid="image-upload-area"
                    >
                      <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">Click to upload trade screenshot</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    data-testid="input-image"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date Time Fields */}
          <AnimatePresence>
            {showDateTime && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-6 p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  {/* Entry Date & Time */}
                  <div>
                    <Label className="text-gray-200 block mb-2">Entry Date & Time</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="entryDate" className="text-sm text-gray-400">Date</Label>
                        <Input
                          id="entryDate"
                          type="date"
                          {...form.register('entryDate')}
                          className="bg-gray-800 border-gray-600 text-white"
                          data-testid="input-entry-date"
                        />
                      </div>
                      <div>
                        <Label htmlFor="entryTime" className="text-sm text-gray-400">Time</Label>
                        <Input
                          id="entryTime"
                          type="time"
                          step="1"
                          {...form.register('entryTime')}
                          className="bg-gray-800 border-gray-600 text-white"
                          data-testid="input-entry-time"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Exit Date & Time */}
                  <div>
                    <Label className="text-gray-200 block mb-2">Exit Date & Time</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="exitDate" className="text-sm text-gray-400">Date</Label>
                        <Input
                          id="exitDate"
                          type="date"
                          {...form.register('exitDate')}
                          className="bg-gray-800 border-gray-600 text-white"
                          data-testid="input-exit-date"
                        />
                      </div>
                      <div>
                        <Label htmlFor="exitTime" className="text-sm text-gray-400">Time</Label>
                        <Input
                          id="exitTime"
                          type="time"
                          step="1"
                          {...form.register('exitTime')}
                          className="bg-gray-800 border-gray-600 text-white"
                          data-testid="input-exit-time"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trade Type Classification */}
          <AnimatePresence>
            {showTradeType && showDateTime && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <Label className="text-gray-200 mb-2 block">Trade Type</Label>
                  <Select 
                    value={form.watch('tradeType') || ''} 
                    onValueChange={(value) => form.setValue('tradeType', value as 'scalp' | 'day' | 'swing')}
                    disabled={!overrideTradeType}
                  >
                    <SelectTrigger className={`border-gray-600 text-white ${overrideTradeType ? 'bg-gray-800' : 'bg-gray-900 cursor-not-allowed'}`} data-testid="select-trade-type">
                      <SelectValue placeholder="Auto-determined from entry/exit duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="scalp" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400">⚡</span>
                          <span>Scalp (seconds to minutes)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="day" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-400">☀️</span>
                          <span>Day Trade (minutes to hours, same day)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="swing" className="text-white hover:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <span className="text-orange-400">📈</span>
                          <span>Swing Trade (days to weeks)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Override checkbox */}
                  <div className="flex items-center space-x-2 mt-3">
                    <input 
                      type="checkbox" 
                      id="override-tradetype"
                      checked={overrideTradeType}
                      onChange={(e) => setOverrideTradeType(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      data-testid="checkbox-override-tradetype"
                    />
                    <Label htmlFor="override-tradetype" className="text-gray-300 text-sm cursor-pointer">
                      Override
                    </Label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-200">Trade Notes (Optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Describe your strategy, reasoning, observations..."
              {...form.register('notes')}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              data-testid="textarea-notes"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <Button 
              type="button" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={tradeMutation.isPending}
              data-testid="button-save-trade"
              onClick={() => {
                console.log('Button clicked!');
                const formData = form.getValues();
                console.log('Form data:', formData);
                handleSubmit(formData);
              }}
            >
              {tradeMutation.isPending ? 'Saving...' : (trade ? 'Update Trade' : 'Save Trade')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-200 hover:bg-gray-700"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}