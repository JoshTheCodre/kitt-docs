"use client"

import { useState } from "react"
import { X, CreditCard, Smartphone, Building, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const quickAmounts = [1000, 2500, 5000, 10000, 20000, 50000]

const paymentMethods = [
  {
    id: "card",
    name: "Debit/Credit Card",
    icon: CreditCard,
    description: "Visa, Mastercard, Verve",
    popular: true,
  },
  {
    id: "transfer",
    name: "Bank Transfer",
    icon: Building,
    description: "Direct bank transfer",
    popular: false,
  },
  {
    id: "ussd",
    name: "USSD",
    icon: Smartphone,
    description: "*737# and others",
    popular: false,
  },
]

export default function AddFundsModal({ isOpen, onClose, onAddFunds, loading }) {
  const [selectedAmount, setSelectedAmount] = useState("")
  const [customAmount, setCustomAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")

  if (!isOpen) return null

  const handleAddFunds = () => {
    const amount = Number.parseFloat(selectedAmount || customAmount)
    if (amount > 0) {
      onAddFunds(amount, paymentMethod)
    }
  }

  const finalAmount = Number.parseFloat(selectedAmount || customAmount) || 0

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-md mx-4 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Funds</h2>
              <p className="text-gray-600 text-sm">Top up your wallet securely</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Amount Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Quick Select Amount</label>
            <div className="grid grid-cols-3 gap-3">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount.toString())
                    setCustomAmount("")
                  }}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    selectedAmount === amount.toString()
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-bold text-lg">₦{(amount / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-gray-500">₦{amount.toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Payment Method</label>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={`cursor-pointer transition-all ${
                    paymentMethod === method.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          paymentMethod === method.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <method.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{method.name}</span>
                          {method.popular && <Badge className="bg-green-100 text-green-700 text-xs">Popular</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${
                          paymentMethod === method.id ? "border-blue-500 bg-blue-500" : "border-gray-300"
                        }`}
                      >
                        {paymentMethod === method.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Summary */}
          {finalAmount > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">You're adding</p>
                    <p className="text-2xl font-bold text-gray-900">₦{finalAmount.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <Button
            onClick={handleAddFunds}
            disabled={loading || finalAmount <= 0}
            className="w-full h-14 text-lg font-semibold rounded-xl bg-blue-500 hover:bg-blue-600"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Add ₦${finalAmount.toLocaleString()} to Wallet`
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">Your payment is secured with 256-bit SSL encryption</p>
        </div>
      </div>
    </div>
  )
}