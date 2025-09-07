import type { Instrument } from "@shared/schema";

export interface TradeCalculation {
  pnl: number;
  ticks: number;
  tickValue: number;
  isProfit: boolean;
}

export function calculateTradePnl(
  entryPrice: number,
  exitPrice: number,
  lotSize: number,
  direction: 'long' | 'short',
  instrument: Instrument
): TradeCalculation {
  const tickValue = parseFloat(instrument.tickValue.toString());
  const tickSize = parseFloat(instrument.tickSize.toString());
  const multiplier = instrument.multiplier;

  // Calculate price difference based on direction
  const priceDiff = direction === 'long' 
    ? exitPrice - entryPrice 
    : entryPrice - exitPrice;

  // Calculate number of ticks
  const ticks = priceDiff / tickSize;

  // Calculate P&L
  const pnl = ticks * tickValue * lotSize * multiplier;

  return {
    pnl: Math.round(pnl * 100) / 100, // Round to 2 decimal places
    ticks,
    tickValue,
    isProfit: pnl > 0,
  };
}

export function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? '+' : '';
  return `${sign}$${pnl.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

export function formatTicks(ticks: number): string {
  return `${ticks.toFixed(1)} ticks`;
}

export function getInstrumentMultiplier(symbol: string): number {
  const multipliers: Record<string, number> = {
    'NQ': 20,    // $20 per tick
    'ES': 50,    // $50 per tick  
    'YM': 5,     // $5 per tick
    'CL': 1000,  // $1000 per tick
    'GC': 100,   // $100 per tick
  };
  
  return multipliers[symbol] || 1;
}

export function getTickSize(symbol: string): number {
  const tickSizes: Record<string, number> = {
    'NQ': 0.25,
    'ES': 0.25,
    'YM': 1.0,
    'CL': 0.01,
    'GC': 0.10,
  };
  
  return tickSizes[symbol] || 0.01;
}

export function getTickValue(symbol: string): number {
  const tickValues: Record<string, number> = {
    'NQ': 5.00,
    'ES': 12.50,
    'YM': 5.00,
    'CL': 10.00,
    'GC': 10.00,
  };
  
  return tickValues[symbol] || 1.00;
}
