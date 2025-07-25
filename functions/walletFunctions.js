
import { supabase } from "@/lib/supabase";

// Fetch user wallet balance
export const fetchUserWallet = async (userId) => {
  try {
    console.log("Fetching wallet balance for user:", userId);
    
    const { data, error } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    const balance = data?.balance || 0;
    console.log("User wallet balance fetched:", balance);
    return { balance };
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return { balance: 0 };
  }
};

// Fetch wallet transactions (funding, withdrawals)
export const fetchWalletTransactions = async (userId) => {
  try {
    console.log("Fetching wallet transactions for user:", userId);
    
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    console.log("Wallet transactions fetched:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    return [];
  }
};

// Fetch purchase and sales transactions
export const fetchUserTransactions = async (userId) => {
  try {
    console.log("Fetching user transactions for:", userId);
    
    const { data, error } = await supabase
      .from("transactions")
      .select(`
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
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const transactions = data || [];
    
    // Separate purchases and sales
    const purchases = transactions.filter(txn => txn.buyer_id === userId);
    const sales = transactions.filter(txn => txn.seller_id === userId);

    console.log("User transactions fetched - Purchases:", purchases.length, "Sales:", sales.length);
    
    return {
      allTransactions: transactions,
      purchases,
      sales
    };
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return {
      allTransactions: [],
      purchases: [],
      sales: []
    };
  }
};

// Add funds to wallet
export const addFundsToWallet = async (userId, amount, reference) => {
  try {
    console.log("Adding funds to wallet:", userId, amount, reference);
    
    // First, get current balance
    const { data: walletData } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const currentBalance = walletData?.balance || 0;
    const newBalance = currentBalance + amount;

    // Update wallet balance
    const { error: walletError } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", userId);

    if (walletError) throw walletError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        amount: amount,
        type: "credit",
        method: "Paystack",
        reference: reference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (transactionError) throw transactionError;

    console.log("Funds added successfully. New balance:", newBalance);
    return { success: true, newBalance };
  } catch (error) {
    console.error("Error adding funds to wallet:", error);
    throw error;
  }
};

// Withdraw funds from wallet
export const withdrawFundsFromWallet = async (userId, amount) => {
  try {
    console.log("Withdrawing funds from wallet:", userId, amount);
    
    // Get current balance
    const { data: walletData } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const currentBalance = walletData?.balance || 0;

    if (currentBalance < amount) {
      throw new Error("Insufficient balance");
    }

    const newBalance = currentBalance - amount;

    // Update wallet balance
    const { error: walletError } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", userId);

    if (walletError) throw walletError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        amount: amount,
        type: "debit",
        method: "Withdrawal",
        reference: `WD_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (transactionError) throw transactionError;

    console.log("Funds withdrawn successfully. New balance:", newBalance);
    return { success: true, newBalance };
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    throw error;
  }
};

// Process payment with Paystack
export const processPaystackPayment = (amount, email, onSuccess, onCancel, onError) => {
  console.log("Processing Paystack payment:", amount, email);
  
  if (!window.PaystackPop) {
    const error = { message: "Paystack script not loaded." };
    console.error("Paystack error:", error);
    onError && onError(error);
    return;
  }

  const popup = new window.PaystackPop();
  popup.newTransaction({
    key: "pk_test_afee4e91679f8d2b4f1e64d7c60140493f7260ec", // Your Paystack public key
    amount: amount * 100, // Amount in kobo
    email,
    onSuccess: (transaction) => {
      console.log("Paystack payment successful:", transaction.reference);
      onSuccess && onSuccess(transaction);
    },
    onCancel: () => {
      console.log("Paystack payment cancelled");
      onCancel && onCancel();
    },
    onError: (error) => {
      console.error("Paystack payment error:", error);
      onError && onError(error);
    },
  });
};
