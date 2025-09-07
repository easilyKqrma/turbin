import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Plus, Heart, PieChart } from "lucide-react";

interface MobileNavProps {
  onNewTrade: () => void;
  onLogEmotion: () => void;
}

export default function MobileNav({ onNewTrade, onLogEmotion }: MobileNavProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40">
      <div className="flex items-center justify-around py-2">
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center p-2 ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}
            data-testid="mobile-nav-dashboard"
          >
            <BarChart3 className="h-5 w-5 mb-1" />
            <span className="text-xs">Dashboard</span>
          </Button>
        </Link>
        
        <Link href="/trades">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center p-2 ${isActive("/trades") ? "text-primary" : "text-muted-foreground"}`}
            data-testid="mobile-nav-trades"
          >
            <TrendingUp className="h-5 w-5 mb-1" />
            <span className="text-xs">Trades</span>
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex flex-col items-center p-2"
          onClick={onNewTrade}
          data-testid="mobile-nav-add-trade"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-1 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs font-medium text-primary">Add</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex flex-col items-center p-2 text-muted-foreground"
          onClick={onLogEmotion}
          data-testid="mobile-nav-emotions"
        >
          <Heart className="h-5 w-5 mb-1" />
          <span className="text-xs">Emotions</span>
        </Button>
        
        <Link href="/stats">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center p-2 ${isActive("/stats") ? "text-primary" : "text-muted-foreground"}`}
            data-testid="mobile-nav-analytics"
          >
            <PieChart className="h-5 w-5 mb-1" />
            <span className="text-xs">Stats</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
