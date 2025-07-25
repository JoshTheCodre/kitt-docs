import { supabase } from "@/lib/supabase";

// Fetch user wallet balance
export const fetchWalletBalance = async (userId) => {
  try {
    console.log("Fetching wallet balance for:", userId);

    const { data, error } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    const balance = data?.balance || 0;
    console.log("Wallet balance fetched:", balance);
    return balance;
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return 0;
  }
};

// Fetch wallet transactions
export const fetchWalletTransactions = async (userId) => {
  try {
    console.log("Fetching wallet transactions for:", userId);

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

// Fetch resource transactions (purchases/sales)
export const fetchResourceTransactions = async (userId) => {
  try {
    console.log("Fetching resource transactions for:", userId);

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

    console.log("Resource transactions fetched:", data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("Error fetching resource transactions:", error);
    return [];
  }
};

// Update wallet balance
export const updateWalletBalance = async (userId, newBalance) => {
  try {
    console.log("Updating wallet balance:", userId, newBalance);

    const { error } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", userId);

    if (error) throw error;

    console.log("Wallet balance updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    return { success: false, error: error.message };
  }
};

// Add wallet transaction record
export const addWalletTransaction = async (transactionData) => {
  try {
    console.log("Adding wallet transaction:", transactionData);

    const { error } = await supabase
      .from("wallet_transactions")
      .insert({
        ...transactionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    console.log("Wallet transaction added successfully");
    return { success: true };
  } catch (error) {
    console.error("Error adding wallet transaction:", error);
    return { success: false, error: error.message };
  }
};

// Process fund addition via Paystack
export const processFundAddition = async (userId, amount, paymentReference) => {
  try {
    console.log("Processing fund addition:", userId, amount);

    // Get current balance
    const currentBalance = await fetchWalletBalance(userId);
    const newBalance = currentBalance + amount;

    // Update balance
    const balanceResult = await updateWalletBalance(userId, newBalance);
    if (!balanceResult.success) {
      throw new Error("Failed to update wallet balance");
    }

    // Add transaction record
    const transactionResult = await addWalletTransaction({
      user_id: userId,
      amount: amount,
      type: "credit",
      method: "Paystack",
      reference: paymentReference,
    });

    if (!transactionResult.success) {
      throw new Error("Failed to record transaction");
    }

    console.log("Fund addition processed successfully");
    return { success: true, newBalance };
  } catch (error) {
    console.error("Error processing fund addition:", error);
    return { success: false, error: error.message };
  }
};

// Filter transactions by type
export const filterTransactionsByType = (transactions, userId, type) => {
  if (type === "purchases") {
    return transactions.filter((txn) => txn.buyer_id === userId);
  } else if (type === "sales") {
    return transactions.filter((txn) => txn.seller_id === userId);
  }
  return transactions;
};

// Calculate total earnings from sales
export const calculateTotalEarnings = (salesTransactions) => {
  return salesTransactions.reduce((total, txn) => total + (txn.amount || 0), 0);
};

// Get transaction statistics
export const getTransactionStats = (transactions, userId) => {
  const purchases = filterTransactionsByType(transactions, userId, "purchases");
  const sales = filterTransactionsByType(transactions, userId, "sales");

  return {
    totalPurchases: purchases.length,
    totalSales: sales.length,
    totalSpent: purchases.reduce((total, txn) => total + (txn.amount || 0), 0),
    totalEarned: calculateTotalEarnings(sales),
  };
};