import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPnl } from "@/lib/trading-calculations";
import { TradeWithRelations } from "@shared/schema";
import { format } from "date-fns";
import { X } from "lucide-react";
import { useState } from "react";

interface TradesTableProps {
  trades: TradeWithRelations[];
  isLoading?: boolean;
  onViewTrade?: (tradeId: string) => void;
  onDeleteTrade?: (tradeId: string) => void;
}

export default function TradesTable({ trades, isLoading, onViewTrade, onDeleteTrade }: TradesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);

  const handleDeleteClick = (tradeId: string) => {
    setTradeToDelete(tradeId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tradeToDelete && onDeleteTrade) {
      onDeleteTrade(tradeToDelete);
    }
    setDeleteDialogOpen(false);
    setTradeToDelete(null);
  };
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No trades found. Start by adding your first trade!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Instrument</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Entry</TableHead>
              <TableHead>Exit</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>P&L</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow 
                key={trade.id} 
                className="hover:bg-muted/50 transition-colors"
                data-testid={`trade-row-${trade.id}`}
              >
                <TableCell className="text-sm">
                  {trade.createdAt ? format(new Date(trade.createdAt), 'MM/dd/yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${
                      (trade.instrument?.symbol || trade.customInstrument) === 'NQ' ? 'border-primary text-primary' :
                      (trade.instrument?.symbol || trade.customInstrument) === 'ES' ? 'border-success text-success' :
                      (trade.instrument?.symbol || trade.customInstrument) === 'YM' ? 'border-warning text-warning' :
                      'border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {trade.instrument?.symbol || trade.customInstrument || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={trade.direction === 'long' ? 'default' : 'destructive'}>
                    {trade.direction.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {trade.entryPrice ? parseFloat(trade.entryPrice.toString()).toFixed(2) : '-'}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {trade.exitPrice ? parseFloat(trade.exitPrice.toString()).toFixed(2) : '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {trade.lotSize} {trade.lotSize === 1 ? 'lot' : 'lots'}
                </TableCell>
                <TableCell>
                  {trade.pnl ? (
                    <span className={`font-medium ${
                      parseFloat(trade.pnl.toString()) >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {formatPnl(parseFloat(trade.pnl.toString()))}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={trade.status === 'open' ? 'secondary' : 'outline'}
                    className={trade.status === 'open' ? 'text-warning' : 'text-muted-foreground'}
                  >
                    {trade.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewTrade?.(trade.id)}
                      data-testid={`button-view-trade-${trade.id}`}
                    >
                      View
                    </Button>
                    {onDeleteTrade && (
                      <AlertDialog open={deleteDialogOpen && tradeToDelete === trade.id} onOpenChange={(open) => {
                        if (!open) {
                          setDeleteDialogOpen(false);
                          setTradeToDelete(null);
                        }
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteClick(trade.id)}
                            data-testid={`button-delete-trade-${trade.id}`}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Trade?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this trade and all its associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleConfirmDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
