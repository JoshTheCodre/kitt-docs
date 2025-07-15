
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const WalletTransactionList = ({ transactions = [], type = 'all' }) => {
  const filteredTransactions = transactions.filter(transaction => {
    if (type === 'all') return true;
    if (type === 'purchases') return transaction.type === 'purchase';
    if (type === 'sales') return transaction.type === 'sale';
    return true;
  });

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTransactions.map((transaction) => (
        <Card key={transaction.id} className="w-full">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{transaction.title || 'Transaction'}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  ₦{transaction.amount?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {transaction.status || 'completed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WalletTransactionList;
