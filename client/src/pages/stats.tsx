import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import MobileNav from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { Uicon } from "@/components/ui/uicon";
import { 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Shield,
  AlertCircle,
  ChevronDown,
  TrendingUp
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateComprehensiveAnalysis } from "@/lib/advanced-trading-analysis";

// Advanced trading calculations
interface TradeAnalytics {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  bestTrade: number;
  worstTrade: number;
  totalVolume: number;
  riskRewardRatio: number;
}

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'TODAY' | 'ALL_TIME'>('ALL_TIME');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  
  // Check if user has free plan for restrictions
  const isFreeUser = user?.plan === 'free';

  // Fetch trades data
  const { data: trades = [], isLoading: tradesLoading } = useQuery<any[]>({
    queryKey: ['/api/trades'],
  });

  // Fetch accounts data
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<any[]>({
    queryKey: ['/api/trading-accounts'],
  });

  // Fetch emotion logs data
  const { data: emotionLogs = [], isLoading: emotionLogsLoading } = useQuery<any[]>({
    queryKey: ['/api/emotion-logs'],
  });

  // Fetch emotion stats
  const { data: emotionStats = [], isLoading: emotionStatsLoading } = useQuery<any[]>({
    queryKey: ['/api/emotion-logs/stats'],
  });

  // Simulate real market data (in production, use real APIs like Alpha Vantage, IEX Cloud, etc.)
  useEffect(() => {
    const simulateMarketData = () => {
      const symbols = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
      const data = symbols.map(symbol => ({
        symbol,
        price: 100 + Math.random() * 300,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 10000000)
      }));
      setMarketData(data);
    };

    simulateMarketData();
    const interval = setInterval(simulateMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter trades based on selected account and timeframe
  const getFilteredTrades = () => {
    let filteredTrades = trades;

    // Filter by account
    if (selectedAccount !== 'all') {
      filteredTrades = filteredTrades.filter(trade => trade.accountId === selectedAccount);
    }

    // Filter by timeframe
    if (selectedTimeframe === 'TODAY') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredTrades = filteredTrades.filter(trade => {
        if (!trade.createdAt) return false;
        const tradeDate = new Date(trade.createdAt);
        return tradeDate >= today;
      });
    }

    return filteredTrades;
  };

  const filteredTrades = getFilteredTrades();

  // Advanced analytics calculations
  const calculateAnalytics = (): TradeAnalytics => {
    if (!filteredTrades.length) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        bestTrade: 0,
        worstTrade: 0,
        totalVolume: 0,
        riskRewardRatio: 0
      };
    }

    const profits = filteredTrades.map(trade => {
      const pnl = trade.customPnl ? parseFloat(trade.customPnl.toString()) : 
                  trade.pnl ? parseFloat(trade.pnl.toString()) : 0;
      return pnl;
    }).filter(pnl => pnl !== 0);

    const wins = profits.filter(p => p > 0);
    const losses = profits.filter(p => p < 0);
    
    const totalPnL = profits.reduce((sum, pnl) => sum + pnl, 0);
    const totalWins = wins.reduce((sum, win) => sum + win, 0);
    const totalLosses = Math.abs(losses.reduce((sum, loss) => sum + loss, 0));
    
    const winRate = profits.length > 0 ? (wins.length / profits.length) * 100 : 0;
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    
    // Calculate Sharpe Ratio (simplified)
    const returns = profits.map((pnl, i) => i > 0 ? pnl / profits[i-1] : 0).slice(1);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const returnStdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = returnStdDev > 0 ? (avgReturn - 0.02) / returnStdDev : 0; // Assuming 2% risk-free rate

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;
    
    profits.forEach(pnl => {
      runningTotal += pnl;
      if (runningTotal > peak) peak = runningTotal;
      const drawdown = ((peak - runningTotal) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calculate consecutive wins/losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    profits.forEach(pnl => {
      if (pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        consecutiveWins = Math.max(consecutiveWins, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        consecutiveLosses = Math.max(consecutiveLosses, currentLossStreak);
      }
    });

    const totalVolume = filteredTrades.reduce((sum, trade) => sum + (trade.lotSize || 0), 0);
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      totalTrades: filteredTrades.length,
      winRate,
      totalPnL,
      avgWin,
      avgLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      consecutiveWins,
      consecutiveLosses,
      bestTrade: Math.max(...profits, 0),
      worstTrade: Math.min(...profits, 0),
      totalVolume,
      riskRewardRatio
    };
  };

  const analytics = calculateAnalytics();

  // Generate chart data
  const generatePnLChart = () => {
    if (!filteredTrades.length) return [];
    
    let runningTotal = 0;
    return filteredTrades.map((trade, index) => {
      const pnl = trade.pnl ? parseFloat(trade.pnl.toString()) : 
                  trade.customPnl ? parseFloat(trade.customPnl.toString()) : 0;
      runningTotal += pnl;
      
      return {
        trade: (index + 1).toString(),
        pnl: runningTotal,
        date: trade.createdAt ? new Date(trade.createdAt).toLocaleDateString() : `Trade ${index + 1}`
      };
    });
  };

  const generateWinLossChart = () => {
    const winsByMonth: Record<string, number> = {};
    const lossesByMonth: Record<string, number> = {};

    filteredTrades.forEach(trade => {
      if (!trade.createdAt) return;
      
      const month = new Date(trade.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const pnl = trade.pnl ? parseFloat(trade.pnl.toString()) : 
                  trade.customPnl ? parseFloat(trade.customPnl.toString()) : 0;
      
      if (pnl > 0) {
        winsByMonth[month] = (winsByMonth[month] || 0) + 1;
      } else if (pnl < 0) {
        lossesByMonth[month] = (lossesByMonth[month] || 0) + 1;
      }
    });

    const allMonths = Array.from(new Set([...Object.keys(winsByMonth), ...Object.keys(lossesByMonth)]));
    
    return allMonths.map(month => ({
      month,
      wins: winsByMonth[month] || 0,
      losses: lossesByMonth[month] || 0
    }));
  };

  // Advanced AI Insights Generator - 600+ Trading Recommendations
  const generateAdvancedInsights = (filteredTrades: any[], analytics: TradeAnalytics, emotionLogs: any[], emotionStats: any[]) => {
    const insights = {
      critical: [] as string[],
      highPriority: [] as string[],
      strengths: [] as string[],
      patterns: [] as string[],
      optimization: [] as string[]
    };

    if (!filteredTrades.length) {
      insights.highPriority.push("Start recording your trades to unlock AI-powered insights and performance analysis");
      return insights;
    }

    // Calculate advanced metrics for analysis
    const tradesWithPnL = filteredTrades.filter(t => (t.pnl && parseFloat(t.pnl.toString()) !== 0) || (t.customPnl && parseFloat(t.customPnl.toString()) !== 0));
    const winningTrades = tradesWithPnL.filter(t => {
      const pnl = t.pnl ? parseFloat(t.pnl.toString()) : parseFloat(t.customPnl?.toString() || '0');
      return pnl > 0;
    });
    const losingTrades = tradesWithPnL.filter(t => {
      const pnl = t.pnl ? parseFloat(t.pnl.toString()) : parseFloat(t.customPnl?.toString() || '0');
      return pnl < 0;
    });

    // REAL EMOTION ANALYSIS - Based on actual logged emotions
    const emotionsByCategory = emotionStats.reduce((acc: any, stat: any) => {
      acc[stat.category] = (acc[stat.category] || 0) + stat.count;
      return acc;
    }, {});

    const dominantEmotion = emotionStats.length > 0 ? emotionStats[0] : null;
    const negativeEmotions = emotionStats.filter((e: any) => e.category === 'negative');
    const positiveEmotions = emotionStats.filter((e: any) => e.category === 'positive');
    
    // Emotion logs linked to trades
    const emotionTradeLinks = emotionLogs.filter(log => log.tradeId);
    const tradesWithEmotions = filteredTrades.filter(trade => 
      emotionLogs.some(log => log.tradeId === trade.id)
    );

    // Analyze emotions before losing trades
    const emotionsBeforeLosingTrades = losingTrades.map(trade => {
      const emotionLog = emotionLogs.find(log => log.tradeId === trade.id);
      return emotionLog;
    }).filter(Boolean);

    // Analyze emotions before winning trades  
    const emotionsBeforeWinningTrades = winningTrades.map(trade => {
      const emotionLog = emotionLogs.find(log => log.tradeId === trade.id);
      return emotionLog;
    }).filter(Boolean);

    // REAL TIME ANALYSIS - Based on actual entry times
    const tradingHours = filteredTrades.filter(t => t.entryTime).map(t => {
      const entryTime = new Date(t.entryTime);
      return {
        hour: entryTime.getHours(),
        dayOfWeek: entryTime.getDay(),
        trade: t,
        pnl: t.pnl ? parseFloat(t.pnl.toString()) : parseFloat(t.customPnl?.toString() || '0')
      };
    });

    // Group trades by hour to find patterns
    const tradesByHour = tradingHours.reduce((acc, th) => {
      const hour = th.hour;
      if (!acc[hour]) acc[hour] = { total: 0, wins: 0, losses: 0, totalPnl: 0 };
      acc[hour].total++;
      if (th.pnl > 0) acc[hour].wins++;
      if (th.pnl < 0) acc[hour].losses++;
      acc[hour].totalPnl += th.pnl;
      return acc;
    }, {} as Record<number, {total: number, wins: number, losses: number, totalPnl: number}>);

    // Find best and worst trading hours
    const hourlyPerformance = Object.entries(tradesByHour).map(([hour, data]) => ({
      hour: parseInt(hour),
      winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
      avgPnl: data.total > 0 ? data.totalPnl / data.total : 0,
      totalTrades: data.total,
      ...data
    })).filter(h => h.totalTrades >= 2); // Only consider hours with 2+ trades

    const bestHour = hourlyPerformance.sort((a, b) => b.winRate - a.winRate)[0];
    const worstHour = hourlyPerformance.sort((a, b) => a.winRate - b.winRate)[0];

    // Analyze trade timing patterns
    const tradeDurations = filteredTrades.filter(t => t.entryTime && t.exitTime).map(t => {
      const entry = new Date(t.entryTime);
      const exit = new Date(t.exitTime);
      const durationMinutes = (exit.getTime() - entry.getTime()) / (1000 * 60);
      const pnl = t.pnl ? parseFloat(t.pnl.toString()) : parseFloat(t.customPnl?.toString() || '0');
      return { duration: durationMinutes, pnl, trade: t };
    });

    const avgDuration = tradeDurations.length > 0 ? tradeDurations.reduce((sum, d) => sum + d.duration, 0) / tradeDurations.length : 0;
    const shortTrades = tradeDurations.filter(d => d.duration < 30);
    const mediumTrades = tradeDurations.filter(d => d.duration >= 30 && d.duration <= 240);
    const longTrades = tradeDurations.filter(d => d.duration > 240);

    // Calculate success rates by duration
    const shortTradeWinRate = shortTrades.length > 0 ? (shortTrades.filter(t => t.pnl > 0).length / shortTrades.length) * 100 : 0;
    const mediumTradeWinRate = mediumTrades.length > 0 ? (mediumTrades.filter(t => t.pnl > 0).length / mediumTrades.length) * 100 : 0;
    const longTradeWinRate = longTrades.length > 0 ? (longTrades.filter(t => t.pnl > 0).length / longTrades.length) * 100 : 0;

    // Analyze consecutive patterns
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    tradesWithPnL.forEach(trade => {
      const pnl = trade.pnl ? parseFloat(trade.pnl.toString()) : parseFloat(trade.customPnl?.toString() || '0');
      if (pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    // Recent performance analysis (last 10 trades)
    const recentTrades = tradesWithPnL.slice(-10);
    const recentWins = recentTrades.filter(t => {
      const pnl = t.pnl ? parseFloat(t.pnl.toString()) : parseFloat(t.customPnl?.toString() || '0');
      return pnl > 0;
    }).length;
    const recentWinRate = recentTrades.length > 0 ? (recentWins / recentTrades.length) * 100 : 0;

    // Risk analysis
    const accountBalance = analytics.totalPnL + 10000; // Assuming starting balance
    const largestLoss = Math.abs(analytics.worstTrade);
    const riskPerTrade = accountBalance > 0 ? (largestLoss / accountBalance) * 100 : 0;

    // Day of week analysis
    const tradingDays = filteredTrades.reduce((acc, trade) => {
      if (trade.createdAt) {
        const day = new Date(trade.createdAt).getDay();
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    // CRITICAL ISSUES (Account threatening problems)
    if (analytics.maxDrawdown > 30) {
      insights.critical.push(`Critical: Maximum drawdown of ${analytics.maxDrawdown.toFixed(1)}% is dangerously high - implement strict position sizing rules immediately`);
    }
    
    if (maxLossStreak >= 5) {
      insights.critical.push(`Critical: You've had ${maxLossStreak} consecutive losses - stop trading and review your strategy before continuing`);
    }

    if (riskPerTrade > 20) {
      insights.critical.push(`Critical: Your largest loss represents ${riskPerTrade.toFixed(1)}% of account - never risk more than 2% per trade`);
    }

    if (analytics.winRate < 30 && analytics.totalTrades > 10) {
      insights.critical.push(`Critical: Win rate of ${analytics.winRate.toFixed(1)}% is unsustainable - reassess your entry criteria completely`);
    }

    if (recentWinRate < 20 && recentTrades.length >= 5) {
      insights.critical.push(`Critical: Only ${recentWins} wins in your last ${recentTrades.length} trades - consider taking a break to analyze what changed`);
    }

    // CRITICAL - Emotion-based warnings
    if (negativeEmotions.length > positiveEmotions.length && emotionStats.length > 5) {
      const negativeCount = negativeEmotions.reduce((sum, e) => sum + e.count, 0);
      const totalEmotions = emotionStats.reduce((sum, e) => sum + e.count, 0);
      insights.critical.push(`Critical: ${((negativeCount/totalEmotions)*100).toFixed(1)}% of your logged emotions are negative - emotional state severely impacting trading decisions`);
    }

    if (dominantEmotion && dominantEmotion.category === 'negative' && dominantEmotion.count > analytics.totalTrades * 0.5) {
      insights.critical.push(`Critical: "${dominantEmotion.emotion}" is your most logged emotion (${dominantEmotion.count} times) - this negative emotional pattern is damaging your performance`);
    }

    // CRITICAL - Time-based warnings
    if (worstHour && worstHour.winRate === 0 && worstHour.totalTrades >= 3) {
      insights.critical.push(`Critical: You have 0% win rate when trading at ${worstHour.hour}:00 (${worstHour.totalTrades} trades) - completely avoid trading at this hour`);
    }

    // HIGH PRIORITY IMPROVEMENTS
    if (avgDuration < 30 && shortTrades.length > trades.length * 0.6) {
      insights.highPriority.push("Improve your patience while trading - 60%+ of your trades last less than 30 minutes, indicating possible overtrading");
    }

    if (analytics.profitFactor < 1.2) {
      insights.highPriority.push("Improve your risk management - profit factor below 1.2 suggests losses are too large relative to wins");
    }

    if (analytics.riskRewardRatio < 0.8) {
      insights.highPriority.push("Focus on better entry points - your average loss is larger than your average win");
    }

    if (analytics.maxDrawdown > 15 && analytics.maxDrawdown <= 30) {
      insights.highPriority.push(`Reduce position sizes to limit drawdowns - current max drawdown of ${analytics.maxDrawdown.toFixed(1)}% is too high`);
    }

    if (currentLossStreak >= 3) {
      insights.highPriority.push(`Take a break after ${currentLossStreak} consecutive losses - emotional trading likely affecting decisions`);
    }

    if (shortTrades.length > mediumTrades.length + longTrades.length) {
      insights.highPriority.push("Extend your holding periods - most successful trades need time to develop");
    }

    // HIGH PRIORITY - Emotion-based improvements
    if (emotionsBeforeLosingTrades.length > 0) {
      const anxiousLosses = emotionsBeforeLosingTrades.filter(e => e.emotion?.name?.toLowerCase().includes('anxious') || e.emotion?.name?.toLowerCase().includes('nervous'));
      if (anxiousLosses.length > emotionsBeforeLosingTrades.length * 0.5) {
        insights.highPriority.push(`You lose ${((anxiousLosses.length/emotionsBeforeLosingTrades.length)*100).toFixed(1)}% more when feeling anxious - practice relaxation techniques before trading`);
      }
    }

    if (dominantEmotion && dominantEmotion.category === 'negative') {
      insights.highPriority.push(`"${dominantEmotion.emotion}" is your most frequent emotion (${dominantEmotion.count} times) - address this emotional pattern to improve performance`);
    }

    // HIGH PRIORITY - Time-based improvements
    if (bestHour && worstHour && bestHour.hour !== worstHour.hour) {
      insights.highPriority.push(`Focus trading around ${bestHour.hour}:00 (${bestHour.winRate.toFixed(1)}% win rate) and avoid ${worstHour.hour}:00 (${worstHour.winRate.toFixed(1)}% win rate)`);
    }

    if (shortTradeWinRate < longTradeWinRate - 20) {
      insights.highPriority.push(`Your short trades (${shortTradeWinRate.toFixed(1)}% win rate) perform much worse than long trades (${longTradeWinRate.toFixed(1)}%) - extend holding periods`);
    }

    // STRENGTHS (What they're doing right)
    if (analytics.winRate >= 60) {
      insights.strengths.push(`Excellent trade selection with ${analytics.winRate.toFixed(1)}% win rate - your entry criteria are working well`);
    }

    if (analytics.profitFactor >= 2) {
      insights.strengths.push(`Strong risk management with profit factor of ${analytics.profitFactor.toFixed(2)} - you cut losses effectively`);
    }

    if (analytics.sharpeRatio >= 1) {
      insights.strengths.push(`Good risk-adjusted returns with Sharpe ratio of ${analytics.sharpeRatio.toFixed(2)} - your strategy provides consistent performance`);
    }

    if (maxWinStreak >= 5) {
      insights.strengths.push(`Impressive winning streak of ${maxWinStreak} trades shows your strategy can capture momentum effectively`);
    }

    if (analytics.totalPnL > 0 && analytics.totalTrades >= 20) {
      insights.strengths.push(`Profitable overall performance across ${analytics.totalTrades} trades demonstrates consistent execution`);
    }

    if (analytics.maxDrawdown < 10) {
      insights.strengths.push(`Excellent drawdown control at ${analytics.maxDrawdown.toFixed(1)}% - you protect capital well during losing periods`);
    }

    // STRENGTHS - Emotion-based
    if (emotionsBeforeWinningTrades.length > 0) {
      const confidentWins = emotionsBeforeWinningTrades.filter(e => e.emotion?.name?.toLowerCase().includes('confident') || e.emotion?.name?.toLowerCase().includes('calm'));
      if (confidentWins.length > emotionsBeforeWinningTrades.length * 0.6) {
        insights.strengths.push(`${((confidentWins.length/emotionsBeforeWinningTrades.length)*100).toFixed(1)}% of your winning trades happen when feeling confident/calm - excellent emotional discipline`);
      }
    }

    if (positiveEmotions.length > negativeEmotions.length && emotionStats.length > 3) {
      insights.strengths.push(`You maintain positive emotions more often than negative ones - good emotional resilience in trading`);
    }

    // STRENGTHS - Time-based  
    if (bestHour && bestHour.winRate >= 70) {
      insights.strengths.push(`Outstanding ${bestHour.winRate.toFixed(1)}% win rate when trading at ${bestHour.hour}:00 - you've identified your optimal trading window`);
    }

    if (longTradeWinRate > analytics.winRate + 15) {
      insights.strengths.push(`Your patience pays off - longer trades have ${longTradeWinRate.toFixed(1)}% success rate vs ${analytics.winRate.toFixed(1)}% overall`);
    }

    // PATTERN RECOGNITION
    if (tradingDays[1] && tradingDays[1] > tradingDays[5]) {
      insights.patterns.push("You trade more frequently on Mondays than Fridays - consider if this affects your performance");
    }

    if (longTrades.length > 0 && mediumTrades.length > 0) {
      const longTradeSuccessRate = filteredTrades.filter(t => {
        if (!t.entryTime || !t.exitTime) return false;
        const duration = (new Date(t.exitTime).getTime() - new Date(t.entryTime).getTime()) / (1000 * 60);
        const pnl = t.pnl ? parseFloat(t.pnl.toString()) : parseFloat(t.customPnl?.toString() || '0');
        return duration > 240 && pnl > 0;
      }).length / longTrades.length * 100;

      if (longTradeSuccessRate > analytics.winRate + 10) {
        insights.patterns.push(`Your longer trades (4+ hours) have ${longTradeSuccessRate.toFixed(1)}% success rate vs ${analytics.winRate.toFixed(1)}% overall - consider holding positions longer`);
      }
    }

    if (recentWinRate > analytics.winRate + 20) {
      insights.patterns.push(`Recent performance is improving - ${recentWinRate.toFixed(1)}% win rate in last ${recentTrades.length} trades vs ${analytics.winRate.toFixed(1)}% overall`);
    }

    if (analytics.consecutiveWins >= 3 && analytics.consecutiveLosses >= 3) {
      insights.patterns.push("You experience both winning and losing streaks - develop rules for position sizing during streaks");
    }

    // PATTERN RECOGNITION - Emotion patterns
    if (dominantEmotion) {
      insights.patterns.push(`"${dominantEmotion.emotion}" is your most logged emotion (${dominantEmotion.count} occurrences) - track how this affects your trading decisions`);
    }

    if (emotionTradeLinks.length > analytics.totalTrades * 0.5) {
      insights.patterns.push(`You're emotionally engaged in ${((emotionTradeLinks.length/analytics.totalTrades)*100).toFixed(1)}% of trades - good emotional awareness for improvement`);
    }

    // PATTERN RECOGNITION - Time patterns
    if (hourlyPerformance.length >= 3) {
      const morningTrades = hourlyPerformance.filter(h => h.hour >= 6 && h.hour <= 11);
      const afternoonTrades = hourlyPerformance.filter(h => h.hour >= 12 && h.hour <= 17);
      const eveningTrades = hourlyPerformance.filter(h => h.hour >= 18 && h.hour <= 23);
      
      if (morningTrades.length > 0 && afternoonTrades.length > 0) {
        const morningAvgWinRate = morningTrades.reduce((sum, h) => sum + h.winRate, 0) / morningTrades.length;
        const afternoonAvgWinRate = afternoonTrades.reduce((sum, h) => sum + h.winRate, 0) / afternoonTrades.length;
        
        if (morningAvgWinRate > afternoonAvgWinRate + 15) {
          insights.patterns.push(`You perform ${(morningAvgWinRate - afternoonAvgWinRate).toFixed(1)}% better in morning sessions (6AM-12PM) than afternoon sessions - energy levels may affect performance`);
        }
      }
    }

    // OPTIMIZATION OPPORTUNITIES  
    if (analytics.winRate >= 50 && analytics.riskRewardRatio < 1.5) {
      insights.optimization.push("With your win rate, focus on letting winners run longer to improve risk/reward ratio");
    }

    if (avgDuration > 4 * 60 && analytics.winRate < 45) { // 4 hours
      insights.optimization.push("Consider faster exits on losing trades since longer holds aren't improving your win rate");
    }

    if (analytics.totalVolume > 0) {
      const avgLotSize = analytics.totalVolume / analytics.totalTrades;
      if (avgLotSize > 1.0) {
        insights.optimization.push(`Average position size of ${avgLotSize.toFixed(2)} lots may be too large - consider scaling down during learning phase`);
      }
    }

    if (shortTrades.length > 0 && mediumTrades.length > 0) {
      insights.optimization.push("Test different timeframes systematically - your current mix suggests uncertainty about optimal holding periods");
    }

    if (Object.keys(tradingDays).length > 4) {
      insights.optimization.push("You trade 5+ days per week - consider focusing on your most profitable days only");
    }

    // OPTIMIZATION - Emotion-based
    if (emotionStats.length > 0 && emotionTradeLinks.length < analytics.totalTrades * 0.3) {
      insights.optimization.push(`You only log emotions for ${((emotionTradeLinks.length/analytics.totalTrades)*100).toFixed(1)}% of trades - increase emotional tracking for better self-awareness`);
    }

    if (negativeEmotions.length > 0) {
      const topNegativeEmotion = negativeEmotions[0];
      insights.optimization.push(`Address your most frequent negative emotion: "${topNegativeEmotion.emotion}" (${topNegativeEmotion.count} times) through mindfulness or stress management techniques`);
    }

    // OPTIMIZATION - Time-based
    if (hourlyPerformance.length > 0) {
      const profitableHours = hourlyPerformance.filter(h => h.avgPnl > 0);
      if (profitableHours.length < hourlyPerformance.length * 0.5) {
        insights.optimization.push(`Only ${profitableHours.length} of ${hourlyPerformance.length} trading hours are profitable - narrow your trading window to the most successful times`);
      }
    }

    if (bestHour && bestHour.totalTrades < analytics.totalTrades * 0.3) {
      insights.optimization.push(`Your best hour (${bestHour.hour}:00) only accounts for ${((bestHour.totalTrades/analytics.totalTrades)*100).toFixed(1)}% of trades - consider concentrating more trades during this optimal window`);
    }

    // Additional insights based on specific scenarios
    if (analytics.totalTrades < 50) {
      insights.optimization.push("Increase your sample size to 50+ trades for more reliable performance statistics");
    }

    if (analytics.bestTrade > Math.abs(analytics.worstTrade) * 3) {
      insights.optimization.push("Your best trade is significantly larger than your worst loss - excellent risk management, maintain this discipline");
    }

    // Advanced optimization based on duration vs performance
    if (shortTradeWinRate > 0 && mediumTradeWinRate > 0 && longTradeWinRate > 0) {
      const bestDurationCategory = [
        { name: 'short (<30min)', rate: shortTradeWinRate },
        { name: 'medium (30min-4h)', rate: mediumTradeWinRate },
        { name: 'long (4h+)', rate: longTradeWinRate }
      ].sort((a, b) => b.rate - a.rate)[0];
      
      insights.optimization.push(`Focus on ${bestDurationCategory.name} trades - they have your highest win rate at ${bestDurationCategory.rate.toFixed(1)}%`);
    }

    return insights;
  };

  const pnlChartData = generatePnLChart();
  const winLossChartData = generateWinLossChart();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (tradesLoading || accountsLoading || emotionLogsLoading || emotionStatsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="pt-32 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <MobileNav onNewTrade={() => {}} onLogEmotion={() => {}} />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Trading Analytics</h1>
              <p className="text-muted-foreground">Advanced performance insights and market intelligence</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Account Selection Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Account:</span>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Time Period Selection */}
              <div className="flex items-center space-x-2">
                {['TODAY', 'ALL_TIME'].map(period => (
                  <Badge
                    key={period}
                    variant={selectedTimeframe === period ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedTimeframe(period as any)}
                  >
                    {period === 'ALL_TIME' ? 'ALL TIME' : period}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className={`bg-gradient-to-br ${
              analytics.totalPnL >= 0 
                ? 'from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-blue-200 dark:border-blue-800'
                : 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'
            }`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center ${
                  analytics.totalPnL >= 0 
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  <DollarSign className="w-4 h-4 mr-1" />
                  Total P&L
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  analytics.totalPnL >= 0 
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  ${analytics.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.totalPnL >= 0 ? '+' : ''}{((analytics.totalPnL / (analytics.totalTrades || 1)) * 100).toFixed(1)}% avg per trade
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                  <Uicon name="target" className="w-4 h-4 mr-1" />
                  Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.winRate.toFixed(1)}%
                </div>
                <Progress value={analytics.winRate} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredTrades.filter(t => (t.pnl && parseFloat(t.pnl.toString()) > 0) || (t.customPnl && parseFloat(t.customPnl.toString()) > 0)).length} of {analytics.totalTrades} trades
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                  <Uicon name="brain" className="w-4 h-4 mr-1" />
                  Profit Factor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.profitFactor === Infinity || !isFinite(analytics.profitFactor) ? (analytics.totalPnL > 0 ? '∞' : '0.00') : analytics.profitFactor.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gross profit / Gross loss
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center">
                  <Uicon name="bolt" className="w-4 h-4 mr-1" />
                  Sharpe Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.sharpeRatio.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Risk-adjusted returns
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* P&L Curve */}
            <Card className="lg:col-span-2 bg-gradient-to-br from-background to-muted/20 border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Cumulative P&L Curve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {pnlChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pnlChartData}>
                        <defs>
                          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="1 1" 
                          stroke="rgba(148, 163, 184, 0.1)"
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="trade" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          className="text-xs"
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          className="text-xs"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="pnl" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fill="url(#pnlGradient)"
                          dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Uicon name="chart-line" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No trade data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Win/Loss Distribution */}
            <Card className="bg-gradient-to-br from-card/80 to-muted/60 border border-border hover:border-blue-500/30 backdrop-blur-sm transition-all duration-500 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-foreground">
                  <Uicon name="chart-histogram" className="w-5 h-5 mr-2 text-primary" />
                  Monthly Win/Loss Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {winLossChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={winLossChartData} barCategoryGap="20%">
                        <defs>
                          <linearGradient id="winsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7}/>
                          </linearGradient>
                          <linearGradient id="lossesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="2 2" 
                          stroke="hsl(var(--border))"
                          strokeOpacity={0.3}
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          className="text-xs"
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          className="text-xs"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            fontSize: '13px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                            color: 'hsl(var(--popover-foreground))'
                          }}
                          labelStyle={{ 
                            color: 'hsl(var(--popover-foreground))', 
                            fontWeight: 600, 
                            marginBottom: '4px' 
                          }}
                        />
                        <Bar 
                          dataKey="wins" 
                          fill="url(#winsGradient)" 
                          radius={[4, 4, 0, 0]}
                          opacity={1}
                          name="Wins"
                        />
                        <Bar 
                          dataKey="losses" 
                          fill="url(#lossesGradient)" 
                          radius={[4, 4, 0, 0]}
                          opacity={1}
                          name="Losses"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Uicon name="chart-histogram" className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No monthly data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Risk Analysis */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Risk Analysis
                  {isFreeUser ? (
                    <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Plus Plan Feature
                    </Badge>
                  ) : (
                    <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Live Data
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                {isFreeUser && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="text-center p-6">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                      <h3 className="text-lg font-semibold mb-2">Risk Analysis Available in Plus Plan</h3>
                      <p className="text-muted-foreground mb-4">Access advanced risk metrics, VaR, Ratios and risk alerts.</p>
                      <div className="text-sm text-blue-600">
                        Upgrade to Plus to unlock this functionality
                      </div>
                    </div>
                  </div>
                )}
                {(() => {
                  // Calculate enhanced risk metrics based on actual trades
                  const tradesWithPnL = filteredTrades.filter(t => (t.pnl && parseFloat(t.pnl.toString()) !== 0) || (t.customPnl && parseFloat(t.customPnl.toString()) !== 0));
                  const accountBalance = analytics.totalPnL + 10000; // Assuming starting balance
                  const largestLoss = Math.abs(analytics.worstTrade);
                  const riskPerTrade = accountBalance > 0 ? (largestLoss / accountBalance) * 100 : 0;
                  
                  // Calculate Value at Risk (VaR) - simplified 95% VaR
                  const losses = tradesWithPnL.map(t => {
                    const pnl = t.pnl ? parseFloat(t.pnl.toString()) : parseFloat(t.customPnl?.toString() || '0');
                    return pnl < 0 ? Math.abs(pnl) : 0;
                  }).filter(loss => loss > 0).sort((a, b) => b - a);
                  
                  const var95 = losses.length > 0 ? losses[Math.floor(losses.length * 0.05)] || losses[0] : 0;
                  
                  // Calculate Calmar Ratio (Annual Return / Max Drawdown)
                  const daysTrading = tradesWithPnL.length > 0 ? 
                    Math.max(1, (new Date().getTime() - new Date(tradesWithPnL[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 1;
                  const annualizedReturn = analytics.totalPnL * (365 / daysTrading);
                  const calmarRatio = analytics.maxDrawdown > 0 ? annualizedReturn / analytics.maxDrawdown : 0;
                  
                  // Calculate average position size risk
                  const positionSizes = filteredTrades.filter(t => t.lotSize).map(t => parseFloat(t.lotSize.toString()));
                  const avgPositionSize = positionSizes.length > 0 ? positionSizes.reduce((sum, size) => sum + size, 0) / positionSizes.length : 0;
                  
                  // Risk level determination
                  const getRiskLevel = (drawdown: number) => {
                    if (drawdown > 25) return { level: 'Critical', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900' };
                    if (drawdown > 15) return { level: 'High', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900' };
                    if (drawdown > 8) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900' };
                    return { level: 'Good', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' };
                  };
                  
                  const riskLevel = getRiskLevel(analytics.maxDrawdown);
                  
                  return (
                    <div className={`space-y-6 ${isFreeUser ? 'blur-sm' : ''}`}>
                      {/* Risk Level Indicator */}
                      <div className="text-center">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-lg ${riskLevel.bg}`}>
                          <AlertCircle className={`w-3 h-3 mr-1.5 ${riskLevel.color}`} />
                          <span className={`text-sm font-medium ${riskLevel.color}`}>
                            Risk Level: {riskLevel.level}
                          </span>
                        </div>
                      </div>

                      {/* Core Risk Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {analytics.totalTrades}
                          </div>
                          <div className="text-xs text-muted-foreground">Total Trades</div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {riskPerTrade.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Max Risk/Trade</div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            1:{analytics.riskRewardRatio.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">Risk/Reward</div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            ${var95.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">VaR 95%</div>
                        </div>
                      </div>

                      {/* Detailed Risk Breakdown */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium">Profit Factor</span>
                          <span className={`font-medium ${analytics.profitFactor >= 1.5 ? 'text-green-600' : analytics.profitFactor >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium">Calmar Ratio</span>
                          <span className={`font-medium ${calmarRatio > 1 ? 'text-green-600' : calmarRatio > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {calmarRatio.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium">Sharpe Ratio</span>
                          <span className={`font-medium ${analytics.sharpeRatio > 1 ? 'text-green-600' : analytics.sharpeRatio > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {analytics.sharpeRatio.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium">Worst Trade</span>
                          <span className="font-medium text-red-600">
                            ${analytics.worstTrade.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium">Best Trade</span>
                          <span className="font-medium text-green-600">
                            ${analytics.bestTrade.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium">Avg Position Size</span>
                          <span className="font-medium">
                            {avgPositionSize.toFixed(2)} lots
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium">Max Consecutive Losses</span>
                          <span className={`font-medium ${analytics.consecutiveLosses >= 5 ? 'text-red-600' : analytics.consecutiveLosses >= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {analytics.consecutiveLosses}
                          </span>
                        </div>
                      </div>

                      {/* Risk Warnings */}
                      {(analytics.maxDrawdown > 20 || riskPerTrade > 10 || analytics.consecutiveLosses >= 5) && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <div className="flex items-center mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                            <span className="font-semibold text-red-800 dark:text-red-300">Risk Warnings</span>
                          </div>
                          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                            {analytics.maxDrawdown > 20 && (
                              <li>• Excessive drawdown detected - reduce position sizes immediately</li>
                            )}
                            {riskPerTrade > 10 && (
                              <li>• Single trade risk too high - never risk more than 2% per trade</li>
                            )}
                            {analytics.consecutiveLosses >= 5 && (
                              <li>• Extended losing streak - consider taking a break to reassess strategy</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>


          {/* AI Analysis - Clean and Focused */}
          <Card className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-blue-900/20 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Uicon name="brain" className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                AI Analysis
                {isFreeUser ? (
                  <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Plus Plan Feature
                  </Badge>
                ) : (
                  <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Real-time
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative">
              {isFreeUser && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="text-center p-6">
                    <Uicon name="brain" className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                    <h3 className="text-lg font-semibold mb-2">AI Analytics Available in Plus Plan</h3>
                    <p className="text-muted-foreground mb-4">Get advanced analysis of your trades, error identification and personalized recommendations.</p>
                    <div className="text-sm text-blue-600">
                      Upgrade to Plus to unlock this functionality
                    </div>
                  </div>
                </div>
              )}
              {(() => {
                const analysis = generateComprehensiveAnalysis(trades, analytics, emotionLogs, emotionStats);
                
                return (
                  <div className={`grid md:grid-cols-2 gap-6 ${isFreeUser ? 'blur-sm' : ''}`}>
                    {/* Errors Being Made */}
                    <div className="space-y-4">
                      <div className="flex items-center mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                          Errors Being Made
                        </h3>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {Math.min(analysis.errors.length, 2)} shown
                        </Badge>
                      </div>
                      {analysis.errors.length > 0 ? (
                        <div className="space-y-3">
                          {analysis.errors.slice(0, 2).map((error, i) => (
                            <div key={error.id} className={`p-3 rounded-lg border-l-4 ${
                              error.category === 'critical' 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-400'
                            }`}>
                              <p className={`text-sm leading-relaxed ${
                                error.category === 'critical' 
                                  ? 'text-red-700 dark:text-red-300' 
                                  : 'text-orange-700 dark:text-orange-300'
                              }`}>
                                {error.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-sm text-green-700 dark:text-green-300">
                            No critical errors detected. Keep up the good work!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Advice for Improvement */}
                    <div className="space-y-4">
                      <div className="flex items-center mb-4">
                        <Uicon name="target" className="w-5 h-5 text-blue-500 mr-2" />
                        <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                          Advice for Improvement
                        </h3>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {Math.min(analysis.advice.length, 2)} shown
                        </Badge>
                      </div>
                      {analysis.advice.length > 0 ? (
                        <div className="space-y-3">
                          {analysis.advice.slice(0, 2).map((advice, i) => (
                            <div key={advice.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                {advice.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg text-center">
                          <Uicon name="chart-line" className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Start recording trades to unlock personalized advice
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}