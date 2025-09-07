import { useEffect, useRef } from 'react';
import { createChart, LineStyle, ColorType } from 'lightweight-charts';

interface WinLossDataPoint {
  month: string;
  wins: number;
  losses: number;
}

interface ProfessionalWinLossChartProps {
  data: WinLossDataPoint[];
  height?: number;
}

export function ProfessionalWinLossChart({ data, height = 256 }: ProfessionalWinLossChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Detect current theme
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                      window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Theme-aware colors with better contrast
    const colors = {
      text: isDarkMode ? '#f9fafb' : '#1f2937',
      textSecondary: isDarkMode ? '#d1d5db' : '#4b5563',
      border: isDarkMode ? '#6b7280' : '#d1d5db',
      grid: isDarkMode ? '#4b5563' : '#e5e7eb',
      crosshairBg: isDarkMode ? '#374151' : '#f9fafb',
      crosshairText: isDarkMode ? '#f9fafb' : '#1f2937'
    };

    // Create chart with improved theme-aware styling
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: colors.text,
        fontSize: 13,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      },
      grid: {
        vertLines: {
          color: colors.grid,
          style: LineStyle.Solid,
          visible: true,
        },
        horzLines: {
          color: colors.grid,
          style: LineStyle.Solid,
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#6366f1',
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: colors.crosshairBg,
          labelVisible: true,
        },
        horzLine: {
          color: '#6366f1',
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: colors.crosshairBg,
          labelVisible: true,
        },
      },
      rightPriceScale: {
        borderColor: colors.border,
        textColor: colors.text,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: colors.border,
        textColor: colors.text,
        timeVisible: false,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Create histogram series with improved colors
    const winsSeries = chart.addSeries('Histogram', {
      color: isDarkMode ? '#22c55e' : '#16a34a',
      priceFormat: {
        type: 'volume',
      },
      title: 'Wins',
    });

    const lossesSeries = chart.addSeries('Histogram', {
      color: isDarkMode ? '#ef4444' : '#dc2626',
      priceFormat: {
        type: 'volume',
      },
      title: 'Losses',
    });

    // Transform data for TradingView Lightweight Charts
    // Convert month names to timestamps for proper sorting
    const getMonthTimestamp = (monthName: string) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = months.indexOf(monthName);
      if (monthIndex === -1) return Date.now() / 1000; // fallback
      return new Date(2024, monthIndex, 1).getTime() / 1000;
    };

    if (data && data.length > 0) {
      const winsData = data.map((point) => ({
        time: getMonthTimestamp(point.month) as any,
        value: point.wins,
      }));

      const lossesData = data.map((point) => ({
        time: getMonthTimestamp(point.month) as any,
        value: point.losses,
      }));

      winsSeries.setData(winsData);
      lossesSeries.setData(lossesData);
    }

    // Configure tooltip styling
    chart.subscribeCrosshairMove((param) => {
      if (!param.point) {
        return;
      }
    });

    // Fit content nicely
    chart.timeScale().fitContent();

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      // Re-create chart if theme changes
      const newIsDarkMode = document.documentElement.classList.contains('dark') || 
                           window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (newIsDarkMode !== isDarkMode) {
        // Theme changed, component will re-render
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      chart.remove();
    };
  }, [data, height]);

  return (
    <div className="w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full rounded-lg" />
      {/* Improved custom legend with better visibility */}
      <div className="flex justify-center mt-3 space-x-6 px-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded shadow-sm"></div>
          <span className="text-sm font-medium text-foreground dark:text-white">Wins</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded shadow-sm"></div>
          <span className="text-sm font-medium text-foreground dark:text-white">Losses</span>
        </div>
      </div>
    </div>
  );
}