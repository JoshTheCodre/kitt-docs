import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function TransactionList({ transactions, type, userId }) {
  if (!transactions?.length) return null;

  // Helper for consistent UI per type
  const getUI = (transaction) => {
    if (type === "sales") {
      // Always incoming for seller
      return {
        icon: <ArrowDownLeft className="w-5 h-5 text-green-600" />,
        colorBg: "bg-green-100",
        colorText: "text-green-600",
        sign: "+",
      };
    }
    if (type === "purchase") {
      // Always outgoing for buyer
      return {
        icon: <ArrowUpRight className="w-5 h-5 text-red-600" />,
        colorBg: "bg-red-100",
        colorText: "text-red-600",
        sign: "-",
      };
    }
    // If you have other types like 'wallet', add them here!
    return {
      icon: <ArrowUpRight className="w-5 h-5 text-gray-400" />,
      colorBg: "bg-gray-200",
      colorText: "text-gray-600",
      sign: "+",
    };
  };

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const { icon, colorBg, colorText, sign } = getUI(transaction);
        return (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorBg}`}>
                {icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 line-clamp-1">
                  {transaction.resources?.title || "Transaction"}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`font-bold ${colorText}`}>
              {sign}₦{transaction.amount.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
