import { useEffect, useRef } from 'react';
import { createChart, LineStyle, ColorType, IChartApi } from 'lightweight-charts';

interface PnLDataPoint {
  trade: string;
  pnl: number;
}

interface ProfessionalPnLChartProps {
  data: PnLDataPoint[];
  height?: number;
}

export function ProfessionalPnLChart({ data, height = 320 }: ProfessionalPnLChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with professional styling
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 12,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      },
      grid: {
        vertLines: {
          color: '#374151',
          style: LineStyle.Dotted,
          visible: true,
        },
        horzLines: {
          color: '#374151',
          style: LineStyle.Dotted,
          visible: true,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#6366f1',
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: '#6366f1',
        },
        horzLine: {
          color: '#6366f1',
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: '#6366f1',
        },
      },
      rightPriceScale: {
        borderColor: '#4b5563',
        textColor: '#9ca3af',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#4b5563',
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

    // Create line series for P&L
    const lineSeries = chart.addAreaSeries({
      topColor: 'rgba(14, 165, 233, 0.56)',
      bottomColor: 'rgba(14, 165, 233, 0.04)',
      lineColor: '#0ea5e9',
      lineWidth: 2,
    });

    // Transform data for TradingView Lightweight Charts
    if (data && data.length > 0) {
      const chartData = data.map((point, index) => ({
        time: (index + 1) as any, // Use trade number as time
        value: point.pnl,
      }));

      lineSeries.setData(chartData);
    }

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

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height]);

  return (
    <div className="w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
}