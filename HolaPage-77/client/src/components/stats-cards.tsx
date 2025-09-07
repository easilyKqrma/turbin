import { Card, CardContent } from "@/components/ui/card";
import { Uicon } from "@/components/ui/uicon";
import { DollarSign, Target, TrendingUp, Activity } from "lucide-react";
import { formatPnl } from "@/lib/trading-calculations";

interface TradeStats {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  avgTrade: number;
  activeTrades: number;
}

interface StatsCardsProps {
  stats: TradeStats;
  isLoading?: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="hover-lift animate-slide-in" data-testid="card-total-pnl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total P&L</p>
              <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPnl(stats.totalPnl)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalTrades} total trades
              </p>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift animate-slide-in" style={{ animationDelay: '0.1s' }} data-testid="card-win-rate">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((stats.winRate / 100) * stats.totalTrades)} winning trades
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift animate-slide-in" style={{ animationDelay: '0.2s' }} data-testid="card-avg-trade">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Trade</p>
              <p className="text-2xl font-bold">{formatPnl(stats.avgTrade)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Per trade average
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift animate-slide-in" style={{ animationDelay: '0.3s' }} data-testid="card-active-trades">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Trades</p>
              <p className="text-2xl font-bold">{stats.activeTrades}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Currently open
              </p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-accent" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
