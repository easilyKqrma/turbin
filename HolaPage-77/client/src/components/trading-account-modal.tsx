import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
// Local validation schema to avoid import issues
const insertTradingAccountSchema = z.object({
  userId: z.string(),
  name: z.string(),
  accountType: z.string(),
  initialCapital: z.string(),
  currency: z.string().optional(),
});

type InsertTradingAccount = z.infer<typeof insertTradingAccountSchema>;
import { z } from "zod";
import { Plus, Wallet } from "lucide-react";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accountType: z.string().min(1, "Account type is required"),
  initialCapital: z.string().min(1, "Initial capital is required"),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface TradingAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCOUNT_TYPES = [
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
  { value: "futures", label: "Futures" },
  { value: "stocks", label: "Stocks" },
  { value: "commodities", label: "Commodities" },
  { value: "bonds", label: "Bonds" },
  { value: "options", label: "Options" },
  { value: "indices", label: "Indices" },
];

export default function TradingAccountModal({ open, onOpenChange }: TradingAccountModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountType: "forex",
      initialCapital: "0",
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      const payload = {
        ...data,
        initialCapital: data.initialCapital,
        currency: 'USD',
      };
      await apiRequest('POST', '/api/trading-accounts', payload);
    },
    onSuccess: () => {
      toast({
        title: "Account created",
        description: "Your trading account has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trading-accounts'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Your session has expired. Logging in...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Could not create trading account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AccountFormData) => {
    createAccountMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900/95 border border-gray-700/50 text-white backdrop-blur-sm">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center">
            <Wallet className="h-6 w-6 mr-2 text-blue-400" />
            New Trading Account
          </DialogTitle>
          <p className="text-gray-400 text-sm mt-2">
            Create a new trading account to organize your trades by market or strategy
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-200 flex items-center font-medium">
              Account Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Main Forex Account, SPY Options Strategy"
              {...form.register('name')}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              data-testid="input-account-name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-400 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200 flex items-center font-medium">
              Market Type
            </Label>
            <Select 
              value={form.watch('accountType')} 
              onValueChange={(value) => form.setValue('accountType', value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" data-testid="select-account-type">
                <SelectValue placeholder="Select market type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                    <span>{type.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              Choose the primary market you'll trade in this account
            </p>
            {form.formState.errors.accountType && (
              <p className="text-sm text-red-400 mt-1">
                {form.formState.errors.accountType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialCapital" className="text-gray-200 flex items-center font-medium">
              Initial Capital ($)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <Input
                id="initialCapital"
                type="number"
                step="0.01"
                min="0"
                placeholder="10,000.00"
                {...form.register('initialCapital')}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 pl-8 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                data-testid="input-initial-capital"
              />
            </div>
            <p className="text-xs text-gray-400">
              The starting balance for this trading account
            </p>
            {form.formState.errors.initialCapital && (
              <p className="text-sm text-red-400 mt-1">
                {form.formState.errors.initialCapital.message}
              </p>
            )}
          </div>


          <div className="flex space-x-4 pt-6 border-t border-gray-700">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium shadow-lg" 
              disabled={createAccountMutation.isPending}
              data-testid="button-create-account"
            >
              {createAccountMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <span>Create Account</span>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-gray-500"
              data-testid="button-cancel-account"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}