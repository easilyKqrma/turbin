import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import MobileNav from "@/components/mobile-nav";
import StatsCards from "@/components/stats-cards";
import EnhancedTradeModal from "@/components/enhanced-trade-modal";
import TradeCarouselModal from "@/components/trade-carousel-modal";
import OnboardingCarousel from "@/components/onboarding-carousel";
import EmotionModal from "@/components/emotion-modal";
import TradingAccountModal from "@/components/trading-account-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, FileText, Wallet, ArrowRight, Download } from "lucide-react";
import { Uicon } from "@/components/ui/uicon";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from "recharts";
import { getIconByName } from "@/lib/emotions";
import type { TradeWithRelations } from "@shared/schema";

interface TradeStats {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  avgTrade: number;
  activeTrades: number;
}

interface EmotionStats {
  emotion: string;
  icon: string;
  count: number;
  percentage: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeCarouselOpen, setTradeCarouselOpen] = useState(false);
  const [emotionModalOpen, setEmotionModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  // Check if user needs onboarding
  const shouldShowOnboarding = user && (user.hasCompletedOnboarding === false || user.hasCompletedOnboarding === undefined);
  
  // Debug: log to check onboarding status
  if (user) {
    console.log('Dashboard - User onboarding status:', {
      user: user.username,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      shouldShowOnboarding
    });
  }

  // Handle opening new trade modal based on user preference
  const handleNewTrade = () => {
    if (user?.preferredTradeInput === 'carousel') {
      setTradeCarouselOpen(true);
    } else {
      setTradeModalOpen(true);
    }
  };

  useEffect(() => {
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, toast]);

  const { data: tradeStats, isLoading: statsLoading } = useQuery<TradeStats>({
    queryKey: ['/api/trades/stats'],
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

  const { data: recentTrades = [], isLoading: tradesLoading } = useQuery<TradeWithRelations[]>({
    queryKey: ['/api/trades'],
    retry: false,
    meta: {
      queryFn: ({ queryKey }: { queryKey: [string] }) => {
        const url = `${queryKey[0]}?limit=5`;
        return fetch(url, { credentials: 'include' }).then(res => res.json());
      }
    }
  });

  const { data: latestTrades = [], isLoading: latestTradesLoading } = useQuery<TradeWithRelations[]>({
    queryKey: ['/api/trades'],
    retry: false,
    select: (data: TradeWithRelations[]) => {
      // Get the latest 8 trades sorted by creation date
      return data
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 8);
    }
  });

  const { data: emotionStats = [], isLoading: emotionStatsLoading } = useQuery<EmotionStats[]>({
    queryKey: ['/api/emotion-logs', 'stats'],
    retry: false,
  });

  // Query for all trades (for export)
  const { data: allTrades = [] } = useQuery<TradeWithRelations[]>({
    queryKey: ['/api/trades', 'export'],
    retry: false,
    meta: {
      queryFn: () => fetch('/api/trades', { credentials: 'include' }).then(res => res.json())
    }
  });

  // Query for trading accounts (for export)
  const { data: tradingAccounts = [] } = useQuery({
    queryKey: ['/api/trading-accounts'],
    retry: false,
  });

  // Query for emotion logs (for export)
  const { data: emotionLogs = [] } = useQuery({
    queryKey: ['/api/emotion-logs'],
    retry: false,
  });

  // Query for trade limits
  const { data: tradeLimits } = useQuery<{
    currentCount: number;
    limit: number | null;
    plan: string;
    canCreateMore: boolean;
    remaining: number | null;
  }>({
    queryKey: ['/api/trades/limits'],
    retry: false,
  });

  // Query for account limits
  const { data: accountLimits } = useQuery<{
    currentCount: number;
    limit: number | null;
    plan: string;
    canCreateMore: boolean;
    remaining: number | null;
  }>({
    queryKey: ['/api/trading-accounts/limits'],
    retry: false,
  });

  // Check if user can create more trades and accounts
  const canCreateTrade = !tradeLimits || tradeLimits.canCreateMore;
  const canCreateAccount = !accountLimits || accountLimits.canCreateMore;

  // Win/Loss data for pie chart - Moved before handleExportData
  const winLossData = recentTrades.reduce((acc, trade) => {
    const pnl = trade.pnl ? parseFloat(trade.pnl.toString()) : 
               trade.customPnl ? parseFloat(trade.customPnl.toString()) : 0;
    if (pnl > 0) {
      acc.wins += 1;
    } else if (pnl < 0) {
      acc.losses += 1;
    }
    return acc;
  }, { wins: 0, losses: 0 });

  // Process chart data
  const processChartData = () => {
    if (!recentTrades.length) return [];
    
    let cumulativePnl = 0;
    return recentTrades
      .slice()
      .reverse() // Show oldest to newest for chart
      .map((trade, index) => {
        const pnl = trade.pnl ? parseFloat(trade.pnl.toString()) : 
                   trade.customPnl ? parseFloat(trade.customPnl.toString()) : 0;
        cumulativePnl += pnl;
        
        return {
          date: trade.createdAt ? new Date(trade.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }) : `Trade ${index + 1}`,
          pnl: cumulativePnl,
          tradePnl: pnl,
          symbol: trade.instrument?.symbol || trade.customInstrument || 'N/A'
        };
      });
  };

  const chartData = processChartData();

  // Professional Data Export Function - Super Completa, Profesional y Excepcional
  const handleExportData = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Get comprehensive data using existing queries
    const exportTrades = latestTrades.length > 0 ? latestTrades : recentTrades;
    
    // Advanced metrics calculations
    const calculateSharpeRatio = (trades: any[]) => {
      if (!trades.length) return 0;
      const returns = trades.map(t => parseFloat((t.pnl || t.customPnl || 0).toString()));
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
      return volatility === 0 ? 0 : (avgReturn / volatility);
    };

    const calculateMaxDrawdown = (trades: any[]) => {
      if (!trades.length) return 0;
      let peak = 0, maxDD = 0, running = 0;
      trades.forEach(trade => {
        running += parseFloat((trade.pnl || trade.customPnl || 0).toString());
        peak = Math.max(peak, running);
        maxDD = Math.min(maxDD, running - peak);
      });
      return peak === 0 ? 0 : Math.abs(maxDD / peak) * 100;
    };

    const calculateProfitFactor = (trades: any[]) => {
      const wins = trades.filter(t => parseFloat((t.pnl || t.customPnl || 0).toString()) > 0);
      const losses = trades.filter(t => parseFloat((t.pnl || t.customPnl || 0).toString()) < 0);
      const totalWins = wins.reduce((sum, t) => sum + parseFloat((t.pnl || t.customPnl || 0).toString()), 0);
      const totalLosses = Math.abs(losses.reduce((sum, t) => sum + parseFloat((t.pnl || t.customPnl || 0).toString()), 0));
      return totalLosses === 0 ? (totalWins > 0 ? 999 : 0) : totalWins / totalLosses;
    };

    // Comprehensive export data structure
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        userUsername: user?.username || 'Unknown',
        totalTrades: exportTrades.length,
        dateRange: exportTrades.length > 0 ? {
          from: exportTrades.reduce((earliest, trade) => 
            trade.createdAt && (!earliest || new Date(trade.createdAt) < new Date(earliest)) 
              ? trade.createdAt : earliest, null),
          to: exportTrades.reduce((latest, trade) => 
            trade.createdAt && (!latest || new Date(trade.createdAt) > new Date(latest)) 
              ? trade.createdAt : latest, null)
        } : null,
        generatedBy: 'GMetrics Trading Analytics Platform',
        version: '2.0',
        exportType: 'comprehensive'
      },
      
      // Performance Summary
      performance: {
        overview: tradeStats || {},
        metrics: {
          totalPnL: tradeStats?.totalPnl || 0,
          averageTrade: tradeStats?.avgTrade || 0,
          winRate: `${(tradeStats?.winRate || 0).toFixed(2)}%`,
          totalTrades: tradeStats?.totalTrades || 0,
          activeTrades: tradeStats?.activeTrades || 0,
          sharpeRatio: calculateSharpeRatio(exportTrades).toFixed(3),
          maxDrawdown: `${calculateMaxDrawdown(exportTrades).toFixed(2)}%`,
          profitFactor: calculateProfitFactor(exportTrades).toFixed(2)
        }
      },
      
      // Detailed Trades Data
      trades: exportTrades.map(trade => ({
        id: trade.id,
        symbol: trade.instrument?.symbol || trade.customInstrument || 'N/A',
        direction: trade.direction,
        entryPrice: trade.entryPrice || 'N/A',
        exitPrice: trade.exitPrice || 'N/A',
        quantity: trade.quantity || 'N/A',
        pnl: trade.pnl || trade.customPnl || 0,
        status: trade.status,
        account: trade.tradingAccount?.name || 'Default',
        accountType: trade.tradingAccount?.type || 'Unknown',
        notes: trade.notes || '',
        createdAt: trade.createdAt || '',
        updatedAt: trade.updatedAt || '',
        imageUrl: trade.imageUrl || '',
        riskRewardRatio: trade.riskRewardRatio || 'N/A',
        tags: trade.tags || []
      })),
      
      // Emotional Analysis
      emotions: {
        summary: emotionStats || [],
        emotionBreakdown: emotionStats.map((stat: any) => ({
          emotion: stat.emotion,
          count: stat.count,
          percentage: `${stat.percentage.toFixed(1)}%`,
          icon: stat.icon
        }))
      },
      
      // Trading Accounts
      accounts: tradingAccounts || [],
      
      // Chart Data
      chartData: chartData || [],
      
      // Win/Loss Analysis
      winLossAnalysis: {
        wins: winLossData.wins,
        losses: winLossData.losses,
        winRate: winLossData.wins + winLossData.losses > 0 
          ? `${((winLossData.wins / (winLossData.wins + winLossData.losses)) * 100).toFixed(1)}%`
          : '0%'
      }
    };

    // 1. Export Complete JSON Data
    const exportJSON = () => {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gmetrics-complete-export-${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // 2. Export Trades CSV
    const exportTradesCSV = () => {
      const csvHeaders = [
        'Trade ID', 'Symbol', 'Direction', 'Entry Price', 'Exit Price', 'Quantity', 
        'P&L', 'Status', 'Account', 'Account Type', 'R:R Ratio', 'Created At', 'Updated At', 'Notes'
      ];
      
      const csvRows = exportTrades.map(trade => [
        trade.id || '',
        trade.instrument?.symbol || trade.customInstrument || 'N/A',
        trade.direction || '',
        trade.entryPrice || '',
        trade.exitPrice || '',
        trade.quantity || '',
        trade.pnl || trade.customPnl || 0,
        trade.status || '',
        trade.tradingAccount?.name || 'Default',
        trade.tradingAccount?.type || 'Unknown',
        trade.riskRewardRatio || '',
        trade.createdAt ? new Date(trade.createdAt).toLocaleString() : '',
        trade.updatedAt ? new Date(trade.updatedAt).toLocaleString() : '',
        (trade.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gmetrics-trades-${timeStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // 3. Export Performance Summary CSV
    const exportSummaryCSV = () => {
      const summaryData = [
        ['GMetrics Trading Analytics - Performance Report'],
        ['Generated:', new Date().toLocaleString()],
        ['User:', user?.username || 'Unknown'],
        ['Export Date:', timestamp],
        [''],
        ['PERFORMANCE METRICS'],
        ['Total P&L:', `$${(tradeStats?.totalPnl || 0).toLocaleString()}`],
        ['Total Trades:', tradeStats?.totalTrades || 0],
        ['Win Rate:', `${(tradeStats?.winRate || 0).toFixed(2)}%`],
        ['Average Trade:', `$${(tradeStats?.avgTrade || 0).toLocaleString()}`],
        ['Active Trades:', tradeStats?.activeTrades || 0],
        [''],
        ['ADVANCED RISK METRICS'],
        ['Sharpe Ratio:', calculateSharpeRatio(exportTrades).toFixed(3)],
        ['Max Drawdown:', `${calculateMaxDrawdown(exportTrades).toFixed(2)}%`],
        ['Profit Factor:', calculateProfitFactor(exportTrades).toFixed(2)],
        [''],
        ['WIN/LOSS BREAKDOWN'],
        ['Winning Trades:', winLossData.wins],
        ['Losing Trades:', winLossData.losses],
        ['Win Percentage:', `${winLossData.wins + winLossData.losses > 0 ? ((winLossData.wins / (winLossData.wins + winLossData.losses)) * 100).toFixed(1) : 0}%`],
        [''],
        ['EMOTIONAL ANALYSIS'],
        ['Top Emotions:', '']
      ];

      // Add emotion data
      emotionStats.slice(0, 5).forEach((emotion: any) => {
        summaryData.push([emotion.emotion, `${emotion.count} trades (${emotion.percentage.toFixed(1)}%)`]);
      });

      const csvContent = summaryData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gmetrics-performance-summary-${timeStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // 4. Export Chart Data CSV
    const exportChartDataCSV = () => {
      const chartHeaders = ['Date', 'Cumulative P&L', 'Trade P&L', 'Symbol'];
      const chartRows = chartData.map(data => [
        data.date,
        data.pnl,
        data.tradePnl,
        data.symbol
      ]);
      
      const csvContent = [chartHeaders, ...chartRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gmetrics-chart-data-${timeStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    // Execute all exports
    exportJSON();
    setTimeout(exportTradesCSV, 100);
    setTimeout(exportSummaryCSV, 200);
    setTimeout(exportChartDataCSV, 300);

    toast({
      title: "🚀 Export Complete - Professional Package",
      description: `4 files exported successfully: Complete JSON, Trades CSV, Performance Summary, and Chart Data (${timestamp})`,
      className: "bg-gradient-to-r from-green-900/90 to-emerald-900/90 border-green-500/30 text-green-100",
      duration: 5000
    });
  };

  const pieData = [
    { name: 'Wins', value: winLossData.wins, color: '#22c55e' },
    { name: 'Losses', value: winLossData.losses, color: '#ef4444' }
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative pb-16 md:pb-0">
      {/* Elegant background with subtle gradient matching landing */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-radial from-blue-600/15 via-blue-800/8 to-transparent rounded-full filter blur-[80px]" />
        <div className="absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>

      <Navigation />
      <MobileNav 
        onNewTrade={handleNewTrade}
        onLogEmotion={() => setEmotionModalOpen(true)}
      />

      <main className="relative z-10 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent" data-testid="welcome-message">
              Welcome back, {user.firstName || user.email?.split('@')[0] || 'Trader'}
            </h1>
            <p className="text-muted-foreground text-lg">Here's your trading performance overview</p>
          </div>

          {/* Stats Cards */}
          <StatsCards 
            stats={tradeStats || { totalPnl: 0, totalTrades: 0, winRate: 0, avgTrade: 0, activeTrades: 0 }}
            isLoading={statsLoading}
          />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Performance Analytics Chart */}
            <Card className="bg-gradient-to-br from-card/80 to-muted/60 border border-border hover:border-blue-500/30 backdrop-blur-sm transition-all duration-500 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-foreground">
                  <div className="flex items-center space-x-2">
                    <Uicon name="chart-histogram" className="h-5 w-5" />
                    <span>Recent Performance</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" data-testid="button-view-all-trades" onClick={() => window.location.href = '/stats'}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="h-64 animate-pulse bg-muted rounded"></div>
                ) : chartData.length > 0 ? (
                  <div className="space-y-4">
                    {/* Cumulative P&L Chart */}
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9CA3AF' }}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value: number, name: string) => [
                              `$${parseFloat(value.toString()).toLocaleString()}`,
                              name === 'pnl' ? 'Cumulative P&L' : 'Trade P&L'
                            ]}
                            labelStyle={{ color: '#9CA3AF' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="pnl" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {winLossData.wins}
                        </div>
                        <div className="text-sm text-gray-400">Winning Trades</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">
                          {winLossData.losses}
                        </div>
                        <div className="text-sm text-gray-400">Losing Trades</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                    <Uicon name="chart-histogram" className="h-12 w-12 mb-4 opacity-50" />
                    <div>No performance data yet</div>
                    <div className="text-sm">Start trading to see your analytics</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emotion Patterns */}
            <Card className="bg-gradient-to-br from-card/80 to-muted/60 border border-border hover:border-blue-500/30 backdrop-blur-sm transition-all duration-500 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-foreground">
                  <span>Emotion Patterns</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setEmotionModalOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="button-view-emotions"
                  >
                    Log Emotion
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emotionStatsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-2 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : emotionStats.length > 0 ? (
                  <div className="space-y-3">
                    {emotionStats.slice(0, 4).map((emotion) => {
                      const IconComponent = getIconByName(emotion.icon);
                      return (
                        <div key={emotion.emotion} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <IconComponent className="h-5 w-5 text-primary" />
                            <span className="text-sm">{emotion.emotion}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-muted rounded-full">
                              <div 
                                className="h-2 bg-primary rounded-full transition-all"
                                style={{ width: `${emotion.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-muted-foreground w-8">
                              {emotion.percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    No emotion data yet. Start logging your feelings!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Button 
                onClick={() => {
                  if (!canCreateTrade) {
                    toast({
                      title: "Límite alcanzado",
                      description: `Has alcanzado el límite de ${tradeLimits?.limit} trades para tu plan ${tradeLimits?.plan}. Actualiza tu plan para crear más trades.`,
                      variant: "destructive",
                    });
                    return;
                  }
                  handleNewTrade();
                }}
                className={`w-full h-14 animate-scale-in ${canCreateTrade 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-400 hover:bg-gray-500 text-gray-200 cursor-not-allowed'
                }`}
                data-testid="button-new-trade"
                disabled={!canCreateTrade}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Trade
              </Button>
              {tradeLimits && tradeLimits.limit && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[3rem] text-center z-10">
                  {tradeLimits.currentCount}/{tradeLimits.limit}
                </div>
              )}
            </div>

            <div className="relative">
              <Button 
                variant="outline"
                onClick={() => {
                  if (!canCreateAccount) {
                    toast({
                      title: "Limit reached",
                      description: `You have reached the limit of ${accountLimits?.limit} accounts for your ${accountLimits?.plan} plan. Upgrade your plan to create more accounts.`,
                      variant: "destructive",
                    });
                    return;
                  }
                  setAccountModalOpen(true);
                }}
                className={`w-full h-14 animate-scale-in ${canCreateAccount 
                  ? 'border-blue-600 text-blue-400 hover:bg-blue-600/20' 
                  : 'border-gray-400 text-gray-400 hover:bg-gray-500/20 cursor-not-allowed'
                }`}
                style={{ animationDelay: '0.1s' }}
                data-testid="button-new-account"
                disabled={!canCreateAccount}
              >
                <Wallet className="h-4 w-4 mr-2" />
                New Account
              </Button>
              {accountLimits && accountLimits.limit && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[3rem] text-center z-10">
                  {accountLimits.currentCount}/{accountLimits.limit}
                </div>
              )}
            </div>

            <div className="relative">
              <Button 
                variant="outline"
                onClick={() => setEmotionModalOpen(true)}
                className="w-full border-blue-600 text-blue-400 hover:bg-blue-600/20 h-14 animate-scale-in"
                style={{ animationDelay: '0.2s' }}
                data-testid="button-log-emotion"
              >
                <Uicon name="brain" className="h-4 w-4 mr-2" />
                Psyche Logs
              </Button>
            </div>

            <div className="relative">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/stats'}
                className="w-full border-blue-600 text-blue-400 hover:bg-blue-600/20 h-14 animate-scale-in"
                style={{ animationDelay: '0.3s' }}
                data-testid="button-see-stats"
              >
                <FileText className="h-4 w-4 mr-2" />
                See Stats
              </Button>
            </div>
          </div>

          {/* Latest Trades List */}
          <div className="mt-8">
            <Card className="bg-gradient-to-br from-card/80 to-muted/60 border border-border hover:border-blue-500/30 backdrop-blur-sm transition-all duration-500 shadow-xl">
              <CardHeader>
                <CardTitle className="text-foreground text-xl font-semibold">
                  Latest Trades
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestTradesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : latestTrades.length > 0 ? (
                  <div className="space-y-3">
                    {latestTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {trade.instrument?.symbol || trade.customInstrument || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              {trade.direction === 'long' ? (
                                <Uicon name="arrow-trend-up" className="h-4 w-4 text-green-400" />
                              ) : (
                                <Uicon name="arrow-trend-down" className="h-4 w-4 text-red-400" />
                              )}
                              <span className="font-medium text-foreground capitalize">
                                {trade.direction}
                              </span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">
                                {trade.lotSize} lots
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {trade.createdAt ? new Date(trade.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {(() => {
                            const pnlValue = trade.customPnl || trade.pnl;
                            if (pnlValue) {
                              const pnlFloat = parseFloat(pnlValue.toString());
                              return (
                                <div className={`text-lg font-semibold ${
                                  pnlFloat >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {pnlFloat >= 0 ? '+' : ''}
                                  ${pnlFloat.toLocaleString()}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    No trades yet. Start by adding your first trade!
                  </div>
                )}
                
                {/* View All Trades Button */}
                <div className="mt-6 flex justify-center">
                  <Button 
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600/20 flex items-center space-x-2"
                    onClick={() => window.location.href = '/trades'}
                    data-testid="button-view-all-trades"
                  >
                    <span>View all the trades</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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
        open={!!shouldShowOnboarding}
        onOpenChange={() => {}}
        userId={user?.id || ''}
      />

      <TradingAccountModal 
        open={accountModalOpen}
        onOpenChange={setAccountModalOpen}
      />

      <EmotionModal 
        open={emotionModalOpen}
        onOpenChange={setEmotionModalOpen}
      />
    </div>
  );
}
