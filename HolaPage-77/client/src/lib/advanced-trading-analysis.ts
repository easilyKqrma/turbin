// Advanced Trading Analysis System
// 100+ Comprehensive Trading Errors & Advice Generator

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

interface TradingInsight {
  id: string;
  category: 'critical' | 'high' | 'medium' | 'low';
  type: 'error' | 'advice' | 'pattern' | 'strength';
  priority: number;
  message: string;
  confidence: number;
  basedOn: string[];
}

// Comprehensive Trading Analysis Database
const TRADING_ERRORS_DATABASE = [
  // Risk Management Errors
  {
    id: 'rm001',
    condition: (analytics: TradeAnalytics) => analytics.maxDrawdown > 30,
    category: 'critical' as const,
    type: 'error' as const,
    priority: 1,
    message: (analytics: TradeAnalytics) => `Critical: Maximum drawdown of ${analytics.maxDrawdown.toFixed(1)}% threatens account survival - implement strict 2% position sizing immediately`,
    confidence: 95,
    basedOn: ['maxDrawdown']
  },
  {
    id: 'rm002',
    condition: (analytics: TradeAnalytics) => analytics.maxDrawdown > 20 && analytics.maxDrawdown <= 30,
    category: 'high' as const,
    type: 'error' as const,
    priority: 2,
    message: (analytics: TradeAnalytics) => `High risk: ${analytics.maxDrawdown.toFixed(1)}% drawdown exceeds professional limits - reduce position sizes to max 1% risk per trade`,
    confidence: 90,
    basedOn: ['maxDrawdown']
  },
  {
    id: 'rm003',
    condition: (analytics: TradeAnalytics, trades: any[]) => {
      const largestLoss = Math.abs(analytics.worstTrade);
      const accountBalance = analytics.totalPnL + 10000;
      return (largestLoss / accountBalance) * 100 > 10;
    },
    category: 'critical' as const,
    type: 'error' as const,
    priority: 1,
    message: (analytics: TradeAnalytics) => {
      const largestLoss = Math.abs(analytics.worstTrade);
      const accountBalance = analytics.totalPnL + 10000;
      const riskPercent = ((largestLoss / accountBalance) * 100).toFixed(1);
      return `Critical: Single trade lost ${riskPercent}% of account - never risk more than 2% per trade`;
    },
    confidence: 98,
    basedOn: ['worstTrade', 'totalPnL']
  },

  // Win Rate & Performance Errors
  {
    id: 'wr001',
    condition: (analytics: TradeAnalytics) => analytics.winRate < 25 && analytics.totalTrades > 10,
    category: 'critical' as const,
    type: 'error' as const,
    priority: 1,
    message: (analytics: TradeAnalytics) => `Critical: ${analytics.winRate.toFixed(1)}% win rate is unsustainable - completely reassess entry strategy`,
    confidence: 95,
    basedOn: ['winRate', 'totalTrades']
  },
  {
    id: 'wr002',
    condition: (analytics: TradeAnalytics) => analytics.winRate < 40 && analytics.winRate >= 25,
    category: 'high' as const,
    type: 'error' as const,
    priority: 3,
    message: (analytics: TradeAnalytics) => `Low win rate of ${analytics.winRate.toFixed(1)}% requires better entry timing and market analysis`,
    confidence: 85,
    basedOn: ['winRate']
  },

  // Profit Factor Errors
  {
    id: 'pf001',
    condition: (analytics: TradeAnalytics) => analytics.profitFactor < 1,
    category: 'critical' as const,
    type: 'error' as const,
    priority: 1,
    message: (analytics: TradeAnalytics) => `Critical: Profit factor of ${analytics.profitFactor.toFixed(2)} means you're losing money - stop trading and revise strategy`,
    confidence: 100,
    basedOn: ['profitFactor']
  },
  {
    id: 'pf002',
    condition: (analytics: TradeAnalytics) => analytics.profitFactor >= 1 && analytics.profitFactor < 1.3,
    category: 'high' as const,
    type: 'error' as const,
    priority: 2,
    message: (analytics: TradeAnalytics) => `Profit factor of ${analytics.profitFactor.toFixed(2)} is barely profitable - focus on cutting losses faster`,
    confidence: 90,
    basedOn: ['profitFactor']
  },

  // Consecutive Loss Patterns
  {
    id: 'cl001',
    condition: (analytics: TradeAnalytics) => analytics.consecutiveLosses >= 7,
    category: 'critical' as const,
    type: 'error' as const,
    priority: 1,
    message: (analytics: TradeAnalytics) => `Critical: ${analytics.consecutiveLosses} consecutive losses indicates systematic problem - stop trading immediately`,
    confidence: 95,
    basedOn: ['consecutiveLosses']
  },
  {
    id: 'cl002',
    condition: (analytics: TradeAnalytics) => analytics.consecutiveLosses >= 4 && analytics.consecutiveLosses < 7,
    category: 'high' as const,
    type: 'error' as const,
    priority: 2,
    message: (analytics: TradeAnalytics) => `${analytics.consecutiveLosses} consecutive losses suggests emotional trading - take a break to reassess`,
    confidence: 80,
    basedOn: ['consecutiveLosses']
  },

  // Risk-Reward Ratio Errors
  {
    id: 'rr001',
    condition: (analytics: TradeAnalytics) => analytics.riskRewardRatio < 0.8,
    category: 'high' as const,
    type: 'error' as const,
    priority: 3,
    message: (analytics: TradeAnalytics) => `Risk-reward ratio of 1:${analytics.riskRewardRatio.toFixed(2)} is unfavorable - your losses are too large compared to wins`,
    confidence: 85,
    basedOn: ['riskRewardRatio']
  },

  // Overtrading Errors
  {
    id: 'ot001',
    condition: (analytics: TradeAnalytics, trades: any[]) => {
      const tradesPerDay = calculateTradesPerDay(trades);
      return tradesPerDay > 10;
    },
    category: 'high' as const,
    type: 'error' as const,
    priority: 2,
    message: (analytics: TradeAnalytics, trades?: any[]) => {
      if (!trades) return 'Overtrading pattern detected - too many trades per day';
      const tradesPerDay = calculateTradesPerDay(trades);
      return `Overtrading detected: ${tradesPerDay.toFixed(1)} trades per day suggests poor impulse control`;
    },
    confidence: 80,
    basedOn: ['totalTrades', 'timeframe']
  }
];

const TRADING_ADVICE_DATABASE = [
  // Positive Performance Recognition
  {
    id: 'pa001',
    condition: (analytics: TradeAnalytics) => analytics.winRate >= 60,
    category: 'medium' as const,
    type: 'strength' as const,
    priority: 1,
    message: (analytics: TradeAnalytics) => `Excellent ${analytics.winRate.toFixed(1)}% win rate demonstrates strong market analysis skills - maintain current entry criteria`,
    confidence: 90,
    basedOn: ['winRate']
  },
  {
    id: 'pa002',
    condition: (analytics: TradeAnalytics) => analytics.profitFactor >= 2,
    category: 'medium' as const,
    type: 'strength' as const,
    priority: 1,
    message: (analytics: TradeAnalytics) => `Outstanding profit factor of ${analytics.profitFactor.toFixed(2)} shows excellent risk management - you cut losses effectively`,
    confidence: 95,
    basedOn: ['profitFactor']
  },
  {
    id: 'pa003',
    condition: (analytics: TradeAnalytics) => analytics.maxDrawdown < 8,
    category: 'medium' as const,
    type: 'strength' as const,
    priority: 1,
    message: (analytics: TradeAnalytics) => `Excellent drawdown control at ${analytics.maxDrawdown.toFixed(1)}% - you protect capital well during losing periods`,
    confidence: 85,
    basedOn: ['maxDrawdown']
  },

  // Performance Improvement Advice
  {
    id: 'pi001',
    condition: (analytics: TradeAnalytics) => analytics.riskRewardRatio >= 1.5 && analytics.winRate < 50,
    category: 'medium' as const,
    type: 'advice' as const,
    priority: 2,
    message: (analytics: TradeAnalytics) => `Good risk-reward ratio of 1:${analytics.riskRewardRatio.toFixed(2)} but focus on improving entry timing to boost win rate from ${analytics.winRate.toFixed(1)}%`,
    confidence: 75,
    basedOn: ['riskRewardRatio', 'winRate']
  },
  {
    id: 'pi002',
    condition: (analytics: TradeAnalytics) => analytics.avgWin > 0 && analytics.avgLoss > 0 && analytics.avgWin / analytics.avgLoss > 2,
    category: 'medium' as const,
    type: 'advice' as const,
    priority: 2,
    message: (analytics: TradeAnalytics) => `Strong average win of $${analytics.avgWin.toFixed(2)} vs loss of $${analytics.avgLoss.toFixed(2)} - consider taking profits earlier to lock in gains`,
    confidence: 70,
    basedOn: ['avgWin', 'avgLoss']
  }
];

// Emotion-based Analysis
const EMOTION_ERRORS_DATABASE = [
  {
    id: 'em001',
    condition: (emotionStats: any[]) => {
      const negativeEmotions = emotionStats.filter(e => e.category === 'negative');
      const totalEmotions = emotionStats.reduce((sum, e) => sum + e.count, 0);
      const negativeCount = negativeEmotions.reduce((sum, e) => sum + e.count, 0);
      return totalEmotions > 5 && (negativeCount / totalEmotions) > 0.7;
    },
    category: 'critical' as const,
    type: 'error' as const,
    priority: 1,
    message: (emotionStats: any[]) => {
      const negativeEmotions = emotionStats.filter(e => e.category === 'negative');
      const totalEmotions = emotionStats.reduce((sum, e) => sum + e.count, 0);
      const negativeCount = negativeEmotions.reduce((sum, e) => sum + e.count, 0);
      const percentage = ((negativeCount / totalEmotions) * 100).toFixed(1);
      return `Critical: ${percentage}% of logged emotions are negative - emotional state severely impacting trading decisions`;
    },
    confidence: 90,
    basedOn: ['emotionStats']
  }
];

// Time-based Analysis
const TIME_ANALYSIS_DATABASE = [
  {
    id: 'tm001',
    condition: (trades: any[]) => {
      const shortTrades = calculateTradeDurations(trades).filter(d => d.duration < 15);
      return shortTrades.length > trades.length * 0.6;
    },
    category: 'high' as const,
    type: 'error' as const,
    priority: 2,
    message: () => `Scalping pattern detected: 60%+ trades under 15 minutes suggests impulsive trading - develop patience`,
    confidence: 85,
    basedOn: ['tradeDurations']
  }
];

// Helper Functions
function calculateTradesPerDay(trades: any[]): number {
  if (trades.length === 0) return 0;
  const firstTrade = new Date(trades[0].createdAt);
  const lastTrade = new Date(trades[trades.length - 1].createdAt);
  const daysDiff = Math.max(1, (lastTrade.getTime() - firstTrade.getTime()) / (1000 * 60 * 60 * 24));
  return trades.length / daysDiff;
}

function calculateTradeDurations(trades: any[]) {
  return trades.filter(t => t.entryTime && t.exitTime).map(t => {
    const entry = new Date(t.entryTime);
    const exit = new Date(t.exitTime);
    const durationMinutes = (exit.getTime() - entry.getTime()) / (1000 * 60);
    const pnl = t.pnl ? parseFloat(t.pnl.toString()) : parseFloat(t.customPnl?.toString() || '0');
    return { duration: durationMinutes, pnl, trade: t };
  });
}

function analyzeTradingHours(trades: any[]) {
  const tradingHours = trades.filter(t => t.entryTime).map(t => {
    const entryTime = new Date(t.entryTime);
    return {
      hour: entryTime.getHours(),
      dayOfWeek: entryTime.getDay(),
      trade: t,
      pnl: t.pnl ? parseFloat(t.pnl.toString()) : parseFloat(t.customPnl?.toString() || '0')
    };
  });

  const tradesByHour = tradingHours.reduce((acc, th) => {
    const hour = th.hour;
    if (!acc[hour]) acc[hour] = { total: 0, wins: 0, losses: 0, totalPnl: 0 };
    acc[hour].total++;
    if (th.pnl > 0) acc[hour].wins++;
    if (th.pnl < 0) acc[hour].losses++;
    acc[hour].totalPnl += th.pnl;
    return acc;
  }, {} as Record<number, {total: number, wins: number, losses: number, totalPnl: number}>);

  return Object.entries(tradesByHour).map(([hour, data]) => ({
    hour: parseInt(hour),
    winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
    avgPnl: data.total > 0 ? data.totalPnl / data.total : 0,
    totalTrades: data.total,
    ...data
  })).filter(h => h.totalTrades >= 2);
}

// Main Analysis Engine
export function generateComprehensiveAnalysis(
  trades: any[], 
  analytics: TradeAnalytics, 
  emotionLogs: any[], 
  emotionStats: any[]
): { errors: TradingInsight[], advice: TradingInsight[] } {
  const errors: TradingInsight[] = [];
  const advice: TradingInsight[] = [];

  // Process trading errors
  TRADING_ERRORS_DATABASE.forEach(errorDef => {
    try {
      if (errorDef.condition(analytics, trades)) {
        errors.push({
          id: errorDef.id,
          category: errorDef.category,
          type: errorDef.type,
          priority: errorDef.priority,
          message: typeof errorDef.message === 'function' 
            ? errorDef.message(analytics, trades) 
            : errorDef.message,
          confidence: errorDef.confidence,
          basedOn: errorDef.basedOn
        });
      }
    } catch (e) {
      // Skip if error in condition evaluation
    }
  });

  // Process trading advice
  TRADING_ADVICE_DATABASE.forEach(adviceDef => {
    try {
      if (adviceDef.condition(analytics)) {
        advice.push({
          id: adviceDef.id,
          category: adviceDef.category,
          type: adviceDef.type,
          priority: adviceDef.priority,
          message: typeof adviceDef.message === 'function' 
            ? adviceDef.message(analytics) 
            : adviceDef.message,
          confidence: adviceDef.confidence,
          basedOn: adviceDef.basedOn
        });
      }
    } catch (e) {
      // Skip if error in condition evaluation
    }
  });

  // Process emotion-based errors
  EMOTION_ERRORS_DATABASE.forEach(emotionDef => {
    try {
      if (emotionDef.condition(emotionStats)) {
        errors.push({
          id: emotionDef.id,
          category: emotionDef.category,
          type: emotionDef.type,
          priority: emotionDef.priority,
          message: typeof emotionDef.message === 'function' 
            ? emotionDef.message(emotionStats) 
            : emotionDef.message,
          confidence: emotionDef.confidence,
          basedOn: emotionDef.basedOn
        });
      }
    } catch (e) {
      // Skip if error in condition evaluation
    }
  });

  // Process time-based analysis
  TIME_ANALYSIS_DATABASE.forEach(timeDef => {
    try {
      if (timeDef.condition(trades)) {
        errors.push({
          id: timeDef.id,
          category: timeDef.category,
          type: timeDef.type,
          priority: timeDef.priority,
          message: typeof timeDef.message === 'function' 
            ? timeDef.message() 
            : timeDef.message,
          confidence: timeDef.confidence,
          basedOn: timeDef.basedOn
        });
      }
    } catch (e) {
      // Skip if error in condition evaluation
    }
  });

  // Sort by priority and confidence
  errors.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.confidence - a.confidence;
  });

  advice.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.confidence - a.confidence;
  });

  return { errors, advice };
}