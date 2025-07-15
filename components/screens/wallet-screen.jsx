"use client";

import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  TrendingUp,
  Eye,
  EyeOff,
  History,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TopNav from "@/components/top-nav";
import { useToast } from "@/hooks/use-toast";
import { mockTransactions } from "@/lib/mock-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/transactionComponents.js";
import { LoaderPlaceholder } from "@/components/transactionComponents.js";
import TransactionList from "@/components/transactionList";
import WalletTransactionList from "@/components/walletTransactionList";

const PAYSTACK_PUBLIC_KEY = "pk_test_afee4e91679f8d2b4f1e64d7c60140493f7260ec"; // <-- REPLACE with your real key

export default function WalletScreen({ user, onNavigate }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const { toast } = useToast();
  // Modal State
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletTxns, setWalletTxns] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
    fetchWalletTransactions();
    setLoadingTransactions(true);
  }, [user.id,balance]);

  const fetchWalletData = async () => {
    const { data } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();
    if (data) setBalance(data.balance);
  };

  const fetchWalletTransactions = async () => {
    const { data: data2, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data2) setWalletTxns(data2);

    if (error) {
      console.error("Error fetching wallet transactions:", error);
      return [];
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          id,
          amount,
          created_at,
          resource_id,
          seller_id,
          buyer_id,
          resources (
            title,
            price
          )
        `
        )
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // If transactions table doesn't exist or has issues, show empty state
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Filtering logic
  const purchaseTxns = transactions.filter((txn) => txn.buyer_id === user.id);
  const salesTxns = transactions.filter((txn) => txn.seller_id === user.id);

  // Paystack payment function (v2 - must create instance!)
  function payWithPaystack(amount, email, onSuccess, onCancel, onError) {
    if (!window.PaystackPop) {
      onError && onError({ message: "Paystack script not loaded." });
      return;
    }
    const popup = new window.PaystackPop();
    popup.newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      amount: amount * 100, // Amount in kobo
      email,
      onSuccess,
      onCancel,
      onError,
    });
  }

  // Launch modal
  const handleAddFundsClick = () => {
    setAmountToAdd("");
    setShowAmountModal(true);
  };

  // Handle Paystack flow on modal "Continue"
  const handleContinue = () => {
    const email = user.email || "noemail@qitt.com";
    const amt = parseInt(amountToAdd);
    if (isNaN(amt) || amt < 100) {
      toast({
        title: "Invalid amount",
        description: "Enter at least ₦100.",
        variant: "destructive",
      });
      return;
    }
    setShowAmountModal(false);
    setLoading(true);
    payWithPaystack(
      amt,
      email,
      async (transaction) => {
        // On payment success
        const newBalance = balance + amt;
        const { error } = await supabase
          .from("wallets")
          .update({ balance: newBalance })
          .eq("user_id", user.id);
        if (error) {
          toast({
            title: "Error adding funds",
            description: "Database error. Please contact support.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const { error: err } = await supabase
          .from("wallet_transactions")
          .insert({
            user_id: user.id,
            amount: amt,
            type: "credit",
            method: "Paystack",
            reference: transaction.reference,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        console.log(err);
        setBalance(newBalance);
        fetchWalletData();
        toast({
          title: "💰 Funds Added Successfully!",
          description: `₦${amt.toLocaleString()} has been added to your wallet.`,
        });
        setLoading(false);
      },
      () => {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the Paystack payment.",
          variant: "destructive",
        });
        setLoading(false);
      },
      (error) => {
        toast({
          title: "Payment Error",
          description: error.message || "Paystack payment failed.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav title="Wallet" showBack onBack={() => onNavigate("home")} />
      <div className="p-6 space-y-6">
        {/* Balance Card */}
        <Card className="bg-slate-900 text-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Available Balance</p>
                  <p className="text-white font-medium">Qitt Wallet</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
              >
                {showBalance ? (
                  <Eye className="w-5 h-5" />
                ) : (
                  <EyeOff className="w-5 h-5" />
                )}
              </Button>
            </div>
            <div className="mb-6">
              <h2 className="text-4xl font-bold mb-2">
                {showBalance ? `₦${balance.toLocaleString()}` : "₦••••••"}
              </h2>
              <div className="flex items-center space-x-2 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+12.5% this month</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleAddFundsClick}
                className="flex-1 bg-white text-slate-900 hover:bg-gray-100 rounded-xl h-12 font-semibold"
              >
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Add Funds
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10 rounded-xl h-12 font-semibold bg-transparent"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="rounded-2xl bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Recent Transactions
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                View All
              </Button>
            </div>
            <Tabs defaultValue="wallet" className="w-full">
              <TabsList className="mb-6 flex justify-between bg-white rounded-xl shadow-sm p-1 gap-2 border border-gray-100">
                <TabsTrigger
                  value="wallet"
                  className="px-5 py-2 font-medium text-gray-700 transition-all duration-150
      hover:bg-gray-100
      data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow
      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 rounded-xl"
                >
                  Wallet
                </TabsTrigger>
                <TabsTrigger
                  value="purchases"
                  className="px-5 py-2 rounded-xl font-medium text-gray-700 transition-all duration-150
      hover:bg-gray-100
      data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow
      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                >
                  Purchases
                </TabsTrigger>
                <TabsTrigger
                  value="sales"
                  className="px-5 py-2 rounded-xl font-medium text-gray-700 transition-all duration-150
      hover:bg-gray-100
      data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 data-[state=active]:shadow
      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                >
                  Sales
                </TabsTrigger>
              </TabsList>

              {/* Wallet Tab */}
              <TabsContent value="wallet">
                {loadingTransactions ? (
                  <LoaderPlaceholder />
                ) : walletTxns.length === 0 ? (
                  <EmptyState
                    title="No wallet transactions"
                    description="Your wallet funding and withdrawal history will appear here"
                    button="Explore Resources"
                    onButtonClick={() => onNavigate("explore")}
                  />
                ) : (
                  <WalletTransactionList transactions={walletTxns} />
                )}
              </TabsContent>

              {/* Purchases Tab */}
              <TabsContent value="purchases">
                {loadingTransactions ? (
                  <LoaderPlaceholder />
                ) : purchaseTxns.length === 0 ? (
                  <EmptyState
                    title="No purchases yet"
                    description="Your purchase history will appear here"
                    button="Explore Resources"
                    onButtonClick={() => onNavigate("explore")}
                  />
                ) : (
                  <TransactionList
                    transactions={purchaseTxns}
                    type={'purchase'}
                    userId={user.id}
                  />
                )}
              </TabsContent>

              {/* Sales Tab */}
              <TabsContent value="sales">
                {loadingTransactions ? (
                  <LoaderPlaceholder />
                ) : salesTxns.length === 0 ? (
                  <EmptyState
                    title="No sales yet"
                    description="Your sales/income history will appear here"
                    button="Explore Resources"
                    onButtonClick={() => onNavigate("explore")}
                  />
                ) : (
                  <TransactionList transactions={salesTxns} userId={user.id} sales={'sales'}/>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      {/* Amount Input Modal */}
      {showAmountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Add Funds</h3>
            <input
              type="number"
              min={100}
              value={amountToAdd}
              onChange={(e) => setAmountToAdd(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 text-lg"
              placeholder="Enter amount (₦)"
              autoFocus
              disabled={loading}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={() => {
                  setShowAmountModal(false);
                  setAmountToAdd("");
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleContinue}
                disabled={loading}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
