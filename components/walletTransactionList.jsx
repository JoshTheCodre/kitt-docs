import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowUpCircle, ArrowDownCircle, CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Plus, Download, Gift } from 'lucide-react';

const WalletTransactionList = ({ transactions = [] }) => {
  const getTransactionIcon = (type, method) => {
    if (type === 'credit') {
      if (method === 'paystack' || method === 'flutterwave') {
        return <CreditCard className="w-5 h-5 text-green-500" />;
      } else if (method === 'bank_transfer') {
        return <Building2 className="w-5 h-5 text-green-500" />;
      } else if (method === 'mobile_money') {
        return <Smartphone className="w-5 h-5 text-green-500" />;
      }
      return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
    } else if (type === 'debit') {
      return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
    }
    return <Banknote className="w-5 h-5 text-gray-500" />;
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="w-full">
          <CardContent>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                  {getTransactionIcon(transaction.type, transaction.method)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.description || `${transaction.type?.charAt(0).toUpperCase() + transaction.type?.slice(1)} Transaction`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(transaction.created_at || transaction.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WalletTransactionList;