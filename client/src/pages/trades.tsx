import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/navigation";
import MobileNav from "@/components/mobile-nav";
import TradesTable from "@/components/trades-table";
import EnhancedTradeModal from "@/components/enhanced-trade-modal";
import TradeCarouselModal from "@/components/trade-carousel-modal";
import OnboardingCarousel from "@/components/onboarding-carousel";
import EmotionModal from "@/components/emotion-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Funnel, 
  MagnifyingGlass 
} from "phosphor-react";
import { ArrowLeftRight } from "lucide-react";
import { Uicon } from "@/components/ui/uicon";
// Import TradeWithRelations type from shared schema
import { TradeWithRelations } from "@shared/schema";

export default function Trades() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeCarouselOpen, setTradeCarouselOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [emotionModalOpen, setEmotionModalOpen] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) {
    // Redirect to login if not authenticated
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 0);
    return null;
  }

  // Check if user needs onboarding - explicitly check the property
  const shouldShowOnboarding = user && (user.hasCompletedOnboarding === false || user.hasCompletedOnboarding === undefined);
  
  // Debug: log to check onboarding status (remove after testing)
  if (user) {
    console.log('User onboarding status:', {
      user: user.username,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      shouldShowOnboarding
    });
  }

  // Handle opening new trade modal based on user preference
  const handleNewTrade = () => {
    if (user.preferredTradeInput === 'carousel') {
      setTradeCarouselOpen(true);
    } else {
      setTradeModalOpen(true);
    }
  };

  const { data: trades = [], isLoading: tradesLoading } = useQuery<TradeWithRelations[]>({
    queryKey: ['/api/trades'],
    retry: false,
    meta: {
      onError: (error: Error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
        }
      }
    }
  });

  // Get unique instruments from user trades instead of all available instruments
  const userInstruments = trades.reduce((unique: Array<{id: string, symbol: string, name: string}>, trade) => {
    const symbol = trade.instrument?.symbol || trade.customInstrument;
    const name = trade.instrument?.name || trade.customInstrument;
    
    if (symbol && !unique.some(i => i.symbol === symbol)) {
      unique.push({
        id: trade.instrument?.id || trade.customInstrument || '',
        symbol: symbol,
        name: name || symbol
      });
    }
    return unique;
  }, []);

  // Filter trades based on selected filters and search
  const filteredTrades = trades.filter(trade => {
    const tradeSymbol = trade.instrument?.symbol || trade.customInstrument;
    const matchesInstrument = selectedInstrument === "all" || tradeSymbol === selectedInstrument;
    const matchesStatus = selectedStatus === "all" || trade.status === selectedStatus;
    const matchesSearch = searchQuery === "" || 
      tradeSymbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.direction.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesInstrument && matchesStatus && matchesSearch;
  });

  // Use the same API endpoint as dashboard for consistency
  const { data: tradeStats, isLoading: statsLoading } = useQuery<{
    totalPnl: number;
    totalTrades: number;
    winRate: number;
    avgTrade: number;
    activeTrades: number;
  }>({
    queryKey: ['/api/trades/stats'],
    retry: false,
    meta: {
      onError: (error: Error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Unauthorized", 
            description: "Your session has expired. Logging in...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
        }
      }
    }
  });

  // Calculate filtered trade count for display
  const filteredTradeCount = filteredTrades.length;

  const handleViewTrade = (tradeId: string) => {
    // Navigate to individual trade page
    window.location.href = `/trade/${tradeId}`;
  };

  // Delete trade mutation
  const { mutate: deleteTrade } = useMutation({
    mutationFn: async (tradeId: string) => {
      const response = await apiRequest('DELETE', `/api/trades/${tradeId}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate trades queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      toast({
        title: "Trade Deleted",
        description: "The trade has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el trade.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTrade = (tradeId: string) => {
    deleteTrade(tradeId);
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />
      <MobileNav 
        onNewTrade={handleNewTrade}
        onLogEmotion={() => setEmotionModalOpen(true)}
      />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="trades-page-title">
                Trading History
              </h1>
              <p className="text-muted-foreground">
                Manage and analyze your trading performance
              </p>
            </div>
            <Button 
              onClick={handleNewTrade}
              className="animate-scale-in"
              data-testid="button-add-new-trade"
            >
              <Uicon name="plus" className="h-4 w-4 mr-2" />
              New Trade
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="hover-lift animate-slide-in" data-testid="summary-filtered-trades">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Filtered Trades
                    </p>
                    <p className="text-2xl font-bold">{filteredTradeCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Funnel className="h-6 w-6 text-primary" weight="duotone" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-slide-in" style={{ animationDelay: '0.1s' }} data-testid="summary-total-pnl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total P&L</p>
                    {statsLoading ? (
                      <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className={`text-2xl font-bold ${(tradeStats?.totalPnl || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {(tradeStats?.totalPnl || 0) >= 0 ? '+' : ''}${(tradeStats?.totalPnl || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    {(tradeStats?.totalPnl || 0) >= 0 ? (
                      <Uicon name="arrow-trend-up" className="h-6 w-6 text-success" />
                    ) : (
                      <Uicon name="arrow-trend-down" className="h-6 w-6 text-destructive" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-slide-in" style={{ animationDelay: '0.2s' }} data-testid="summary-win-rate">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Win Rate
                    </p>
                    {statsLoading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold">{(tradeStats?.winRate || 0).toFixed(1)}%</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Uicon name="target" className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-slide-in" style={{ animationDelay: '0.3s' }} data-testid="summary-avg-trade">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Avg Trade
                    </p>
                    {statsLoading ? (
                      <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
                    ) : (
                      <p className="text-2xl font-bold">${(tradeStats?.avgTrade || 0).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Funnel className="h-5 w-5" weight="duotone" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" weight="duotone" />
                    <Input
                      placeholder="Search trades..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-trades"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Instrument</label>
                  <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                    <SelectTrigger data-testid="select-filter-instrument">
                      <SelectValue placeholder="All instruments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Instruments</SelectItem>
                      {userInstruments.length === 0 ? (
                        <SelectItem value="none" disabled>No instruments used yet</SelectItem>
                      ) : (
                        userInstruments.map((instrument) => (
                          <SelectItem key={instrument.id} value={instrument.symbol}>
                            {instrument.symbol} - {instrument.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger data-testid="select-filter-status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedInstrument("all");
                        setSelectedStatus("all");
                        setSearchQuery("");
                      }}
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid="button-export-filtered"
                    >
                      Export
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {(selectedInstrument !== "all" || selectedStatus !== "all" || searchQuery) && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {selectedInstrument !== "all" && (
                    <Badge variant="secondary" data-testid="active-filter-instrument">
                      Instrument: {selectedInstrument}
                    </Badge>
                  )}
                  {selectedStatus !== "all" && (
                    <Badge variant="secondary" data-testid="active-filter-status">
                      Status: {selectedStatus}
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="secondary" data-testid="active-filter-search">
                      Search: {searchQuery}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trades Table */}
          <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
            <TradesTable 
              trades={filteredTrades}
              isLoading={tradesLoading}
              onViewTrade={handleViewTrade}
              onDeleteTrade={handleDeleteTrade}
            />
          </div>
        </div>
      </main>

      <EnhancedTradeModal 
        open={tradeModalOpen}
        onOpenChange={setTradeModalOpen}
      />

      <TradeCarouselModal 
        open={tradeCarouselOpen}
        onOpenChange={setTradeCarouselOpen}
      />

      <OnboardingCarousel 
        open={shouldShowOnboarding}
        onOpenChange={() => setOnboardingOpen(false)}
        userId={user.id}
      />

      <EmotionModal 
        open={emotionModalOpen}
        onOpenChange={setEmotionModalOpen}
      />
    </div>
  );
}
