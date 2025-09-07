import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText,
  Target,
  Eye,
  EyeOff,
  Image,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Local type definition to avoid import issues
type TradeWithRelations = {
  id: string;
  userId: string;
  accountId: string;
  instrumentId?: string;
  customInstrument?: string;
  direction: string;
  entryPrice?: string;
  exitPrice?: string;
  lotSize: number;
  pnl?: string;
  customPnl?: string;
  status: string;
  result?: string;
  notes?: string;
  imageUrl?: string;
  entryTime?: string;
  exitTime?: string;
  createdAt?: string;
  account: {
    id: string;
    name: string;
    accountType: string;
    currency: string;
    currentCapital?: string;
  };
  instrument?: {
    id: string;
    symbol: string;
    name: string;
  };
};

interface SharedTradePageProps {
  username: string;
  tradeId: string;
}

// Simple Landing-style navbar for shared pages
function SharedNavbar() {
  return (
    <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 glass-nav rounded-full px-8 py-3 shadow-2xl shadow-blue-500/20">
      <div className="flex items-center justify-center">
        <div className="flex items-center">
          <span className="text-xl font-bold text-white">
            G<span className="text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text ml-1">metrics</span>
          </span>
        </div>
      </div>
    </header>
  );
}

export default function SharedTrade({ username, tradeId }: SharedTradePageProps) {
  const { toast } = useToast();
  const [showScreenshot, setShowScreenshot] = useState<boolean>(true);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [imageZoomed, setImageZoomed] = useState<boolean>(false);

  const { data: trade, isLoading: tradeLoading } = useQuery<TradeWithRelations>({
    queryKey: ['/api/shared/trades', username, tradeId],
    retry: false,
    meta: {
      queryFn: ({ queryKey }: { queryKey: [string, string, string] }) => {
        const url = `${queryKey[0]}/${queryKey[1]}/${queryKey[2]}`;
        return fetch(url, { credentials: 'include' }).then(res => {
          if (!res.ok) throw new Error('Trade not found');
          return res.json();
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: "Trade not found or access denied",
          variant: "destructive",
        });
      }
    }
  });

  // Set initial screenshot display based on available data
  useEffect(() => {
    if (trade) {
      // Always show screenshot area, even if no image available
      setShowScreenshot(true);
    }
  }, [trade]);

  // Get emotions for this trade - now using the correct token and system
  const { data: allEmotions = [] } = useQuery<any[]>({
    queryKey: ['/api/emotion-logs'],
    enabled: !!trade,
    retry: false,
  });

  // Filter emotions for this specific trade
  const tradeEmotions = allEmotions.filter((emotion: any) => emotion.tradeId === tradeId);
  
  // Debug log to see if we have emotions
  console.log('All emotions:', allEmotions.length);
  console.log('Trade emotions for', tradeId, ':', tradeEmotions.length);
  console.log('Trade image URL:', trade?.imageUrl);

  const symbol = trade?.instrument?.symbol || trade?.customInstrument || 'N/A';

  if (tradeLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        <SharedNavbar />
        <main className="relative z-10 pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 bg-gray-700 rounded"></div>
                <div className="h-96 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        <SharedNavbar />
        <main className="relative z-10 pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Trade Not Found</h1>
              {/* NO Back to Trades button */}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const pnl = trade.pnl ? parseFloat(trade.pnl.toString()) : 
              trade.customPnl ? parseFloat(trade.customPnl.toString()) : 0;
  const isProfit = pnl > 0;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SharedNavbar />

      <main className="pt-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-8">

          {/* Mobile-Optimized Header */}
          <div className="mb-6">
            {/* NO Back Button */}
            
            {/* Mobile Layout: Stack vertically */}
            <div className="space-y-4 lg:space-y-0 lg:flex lg:items-start lg:justify-between">
              <div className="space-y-2 lg:space-y-3">
                <div className="flex items-center justify-between lg:justify-start lg:space-x-4">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                    {symbol}
                  </h1>
                  {/* NO Edit button mobile */}
                </div>
                <p className="text-muted-foreground text-sm lg:text-base">
                  {trade.createdAt ? new Date(trade.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </p>
              </div>
              
              {/* P&L and Desktop Edit Button */}
              <div className="flex items-center justify-between lg:flex-col lg:items-end lg:space-y-2">
                <div className="text-right">
                  <div className={`text-2xl lg:text-3xl font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isProfit ? '+' : ''}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-muted-foreground text-sm">P&L</div>
                </div>
                <div className="hidden lg:flex items-center space-x-3">
                  {/* NO share button, NO visibility dropdown */}
                  <Select value={showScreenshot ? 'show' : 'hide'} onValueChange={(value) => setShowScreenshot(value === 'show')}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="show">Show Screenshot</SelectItem>
                      <SelectItem value="hide">Hide Screenshot</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* NO Edit Trade button */}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout: Stack everything vertically for small screens */}
          <div className="lg:hidden">
            {/* Mobile P&L Card */}
            <Card className="bg-card border border-border shadow-lg mb-4">
              <CardContent className="p-4 text-center">
                <div className={`text-xl font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isProfit ? '+' : ''}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-muted-foreground text-sm">P&L</div>
              </CardContent>
            </Card>

            {/* Mobile Screenshot */}
            {showScreenshot && (
              <Card className="bg-card border border-border shadow-lg mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Image className="h-4 w-4" />
                      <span>Screenshot</span>
                    </div>
                    <Select value={showScreenshot ? 'show' : 'hide'} onValueChange={(value) => setShowScreenshot(value === 'show')}>
                      <SelectTrigger className="w-20 h-8">
                        <Eye className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="show">Show</SelectItem>
                        <SelectItem value="hide">Hide</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-48 flex items-center justify-center bg-muted rounded-lg relative">
                    {trade?.imageUrl ? (
                      <>
                        <img 
                          src={trade.imageUrl} 
                          alt={`${username}'s Trade Screenshot`} 
                          className="max-w-full max-h-full object-contain rounded-lg cursor-pointer transition-transform hover:scale-105"
                          onClick={() => setImageZoomed(true)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="text-muted-foreground text-center p-4 flex flex-col items-center"><div class="w-12 h-12 bg-muted-foreground/20 rounded-lg flex items-center justify-center mb-2"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div><p class="text-xs">Screenshot not available</p></div>';
                          }}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white border-0"
                          onClick={() => setImageZoomed(true)}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground p-4">
                        <div className="w-12 h-12 bg-muted-foreground/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Image className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-medium mb-1">No Screenshot</p>
                        <p className="text-xs opacity-70">Add when editing</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mobile Trade Emotions - Right under screenshot */}
            {tradeEmotions && tradeEmotions.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800 shadow-lg mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200 text-sm">
                    <span>Trade Emotions</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {tradeEmotions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {tradeEmotions.map((emotionLog: any) => {
                      const emotionName = emotionLog.emotion?.name || emotionLog.userEmotion?.name || 'Unknown';
                      const category = emotionLog.emotion?.category || emotionLog.userEmotion?.category || 'neutral';
                      return (
                        <Badge 
                          key={emotionLog.id} 
                          variant={category === 'positive' ? 'default' : category === 'negative' ? 'destructive' : 'secondary'}
                          className={`text-xs px-2 py-0.5 ${
                            category === 'positive' ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300' :
                            category === 'negative' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {emotionName}
                        </Badge>
                      );
                    })}
                  </div>
                  {tradeEmotions.some((e: any) => e.notes) && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <div className="space-y-2">
                        {tradeEmotions.filter((e: any) => e.notes).map((emotionLog: any) => (
                          <div key={emotionLog.id} className="bg-white/70 dark:bg-black/20 p-2 rounded text-xs">
                            <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                              {emotionLog.emotion?.name || emotionLog.userEmotion?.name}:
                            </div>
                            <div className="text-blue-700 dark:text-blue-300">
                              {emotionLog.notes}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Mobile Trading Notes - Collapsible */}
            {trade.notes && (
              <Card className="bg-card border border-border shadow-lg mb-4">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors pb-2"
                  onClick={() => setShowNotes(!showNotes)}
                >
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Trading Notes</span>
                    </div>
                    {showNotes ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
                {showNotes && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Mobile Trade Overview */}
            <Card className="bg-card border border-border shadow-lg mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Target className="h-4 w-4" />
                  <span>Trade Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Direction</span>
                    <div className="flex items-center space-x-1">
                      {trade.direction === 'long' ? (
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                      <span className={`font-medium capitalize text-xs ${
                        trade.direction === 'long' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.direction}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lots</span>
                    <span className="font-medium text-xs">{trade.lotSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={trade.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                      {trade.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Result</span>
                    {trade.result && (
                      <Badge variant={trade.result === 'profit' ? 'default' : trade.result === 'loss' ? 'destructive' : 'secondary'} className="text-xs">
                        {trade.result}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {(trade.entryPrice || trade.exitPrice) && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {trade.entryPrice && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Entry</span>
                          <span className="font-medium text-xs">${parseFloat(trade.entryPrice.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {trade.exitPrice && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Exit</span>
                          <span className="font-medium text-xs">${parseFloat(trade.exitPrice.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {(trade.entryTime || trade.exitTime || trade.createdAt) && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="space-y-2 text-xs">
                      {trade.entryTime && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Entry Time</span>
                          <span>{new Date(trade.entryTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {trade.exitTime && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Exit Time</span>
                          <span>{new Date(trade.exitTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                      )}
                      {trade.createdAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Created</span>
                          <span>{new Date(trade.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile Trading Account */}
            {trade.account && (
              <Card className="bg-card border border-border shadow-lg mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    <span>Account</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium">{trade.account.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{trade.account.accountType}</span>
                    </div>
                    <div className="flex items-center justify-between col-span-2">
                      <span className="text-muted-foreground">Balance</span>
                      <span className="font-medium">${trade.account.currentCapital ? parseFloat(trade.account.currentCapital.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'} {trade.account.currency}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Desktop Layout: Keep original 3-column layout */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Trade Information - Left Column */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              {/* Trade Overview */}
              <Card className="bg-card border border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Trade Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 lg:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Direction</span>
                    <div className="flex items-center space-x-2">
                      {trade.direction === 'long' ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`font-medium capitalize ${
                        trade.direction === 'long' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.direction}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lot Size</span>
                    <span className="font-medium">{trade.lotSize} lots</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                      {trade.status}
                    </Badge>
                  </div>
                  
                  {trade.entryPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Entry Price</span>
                      <span className="font-medium">${parseFloat(trade.entryPrice.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  {trade.exitPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Exit Price</span>
                      <span className="font-medium">${parseFloat(trade.exitPrice.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  {trade.result && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Result</span>
                      <Badge variant={trade.result === 'profit' ? 'default' : trade.result === 'loss' ? 'destructive' : 'secondary'}>
                        {trade.result}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trading Account */}
              {trade.account && (
                <Card className="bg-card border border-border shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Trading Account</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 lg:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Account</span>
                      <span className="font-medium">{trade.account.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{trade.account.accountType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Currency</span>
                      <span className="font-medium">{trade.account.currency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Current Balance</span>
                      <span className="font-medium">${trade.account.currentCapital ? parseFloat(trade.account.currentCapital.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <Card className="bg-card border border-border shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Timestamps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 lg:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Entry Time</span>
                    <span className="font-medium">
                      {trade.entryTime ? new Date(trade.entryTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  {trade.exitTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Exit Time</span>
                      <span className="font-medium">
                        {new Date(trade.exitTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {trade.createdAt ? new Date(trade.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trade Type</span>
                    <Badge variant="outline">
                      {trade.entryTime && trade.exitTime &&
                      new Date(trade.exitTime).getTime() - new Date(trade.entryTime).getTime() < 24 * 60 * 60 * 1000 
                        ? 'Day Trade' 
                        : trade.entryTime && trade.exitTime ? 'Swing Trade' : 'Unknown'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* NO Edit Modal in shared view */}
            </div>

            {/* Screenshot/Emotions Section - Right Column */}
            <div className="lg:col-span-2">
              {/* Screenshot Display */}
              {showScreenshot && (
                <Card className="bg-card border border-border shadow-xl h-fit mb-4">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Image className="h-5 w-5" />
                      <span>{username}'s Trade Screenshot</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 md:h-96 flex items-center justify-center bg-muted rounded-lg">
                      {trade?.imageUrl ? (
                        <img 
                          src={trade.imageUrl} 
                          alt={`${username}'s Trade Screenshot`} 
                          className="max-w-full max-h-full object-contain rounded-lg"
                          onLoad={() => console.log('Screenshot loaded successfully:', trade.imageUrl)}
                          onError={(e) => {
                            console.error('Screenshot failed to load:', trade.imageUrl);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class="text-muted-foreground text-center p-8 flex flex-col items-center"><div class="w-16 h-16 bg-muted-foreground/20 rounded-lg flex items-center justify-center mb-4"><svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div><p class="text-sm">Screenshot not available</p></div>';
                          }}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground p-8">
                          <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Image className="w-8 h-8" />
                          </div>
                          <p className="text-sm font-medium mb-2">No Screenshot Available</p>
                          <p className="text-xs">Upload a screenshot when editing this trade</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trade Emotions - Positioned EXACTLY under screenshot, above notes */}
              {tradeEmotions && tradeEmotions.length > 0 && (
                <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800 shadow-xl mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="font-medium text-blue-800 dark:text-blue-200">Trade Emotions</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {tradeEmotions.length}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tradeEmotions.map((emotionLog: any) => {
                        const emotionName = emotionLog.emotion?.name || emotionLog.userEmotion?.name || 'Unknown';
                        const category = emotionLog.emotion?.category || emotionLog.userEmotion?.category || 'neutral';
                        return (
                          <Badge 
                            key={emotionLog.id} 
                            variant={category === 'positive' ? 'default' : category === 'negative' ? 'destructive' : 'secondary'}
                            className={`px-2.5 py-1 text-sm ${
                              category === 'positive' ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300' :
                              category === 'negative' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {emotionName}
                          </Badge>
                        );
                      })}
                    </div>
                    {tradeEmotions.some((e: any) => e.notes) && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                        <div className="text-xs font-medium mb-2 text-blue-800 dark:text-blue-200">Notes:</div>
                        <div className="space-y-2">
                          {tradeEmotions.filter((e: any) => e.notes).map((emotionLog: any) => (
                            <div key={emotionLog.id} className="bg-white/70 dark:bg-black/20 p-2 rounded text-xs">
                              <span className="font-medium text-blue-900 dark:text-blue-100">
                                {emotionLog.emotion?.name || emotionLog.userEmotion?.name}:
                              </span>
                              <span className="ml-1 text-blue-700 dark:text-blue-300">
                                {emotionLog.notes}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Trading Notes - Collapsible - Now positioned AFTER emotions */}
              {trade.notes && (
                <Card className="bg-card border border-border shadow-xl mb-6">
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setShowNotes(!showNotes)}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Trading Notes</span>
                      </div>
                      {showNotes ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  {showNotes && (
                    <CardContent>
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
                    </CardContent>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Image Zoom Modal */}
      <Dialog open={imageZoomed} onOpenChange={setImageZoomed}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          <div className="relative flex items-center justify-center w-full h-full">
            {trade?.imageUrl && (
              <img 
                src={trade.imageUrl} 
                alt="Trade Screenshot (Zoomed)" 
                className="max-w-full max-h-full object-contain"
              />
            )}
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 right-4 h-8 w-8 p-0 bg-black/60 hover:bg-black/80 text-white border-0"
              onClick={() => setImageZoomed(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NO Edit Trade Modal in shared view */}
    </div>
  );
}