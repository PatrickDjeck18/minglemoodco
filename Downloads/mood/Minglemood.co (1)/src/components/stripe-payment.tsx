import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import { toast } from "sonner@2.0.3";

interface StripePaymentProps {
  amount: number;
  eventTitle: string;
  clientSecret: string;
  rsvpId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StripePayment({ amount, eventTitle, clientSecret, rsvpId, onSuccess, onCancel }: StripePaymentProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) { // 16 digits + 3 spaces
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) { // MM/YY
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const processPayment = async () => {
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would use Stripe.js here
      // const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      //   payment_method: {
      //     card: elements.getElement(CardElement),
      //     billing_details: {
      //       name: nameOnCard,
      //     },
      //   }
      // });

      // For demo purposes, we'll simulate a successful payment
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        toast("Payment successful! 🎉", {
          description: "Your RSVP has been confirmed."
        });
        onSuccess();
      } else {
        throw new Error('Payment failed. Please try again.');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast("Payment failed", {
        description: error instanceof Error ? error.message : "Please check your card details and try again."
      });
    } finally {
      setProcessing(false);
    }
  };

  const isFormValid = cardNumber.length === 19 && expiryDate.length === 5 && cvv.length >= 3 && nameOnCard.trim().length > 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5 text-[#BF94EA]" />
          Secure Payment
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p className="font-medium">{eventTitle}</p>
          <p className="text-2xl font-bold text-[#BF94EA] mt-2">${amount}</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="nameOnCard">Name on Card</Label>
          <Input
            id="nameOnCard"
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            placeholder="John Doe"
            disabled={processing}
          />
        </div>

        <div>
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            disabled={processing}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              value={expiryDate}
              onChange={handleExpiryChange}
              placeholder="MM/YY"
              disabled={processing}
            />
          </div>
          <div>
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              value={cvv}
              onChange={handleCvvChange}
              placeholder="123"
              type="password"
              disabled={processing}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Secure Payment</p>
              <p className="text-blue-700">
                Your payment information is encrypted and secure. We use Stripe for payment processing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={processPayment}
            disabled={!isFormValid || processing}
            className="flex-1 bg-[#BF94EA] hover:bg-[#A076D1] text-white"
          >
            {processing ? (
              "Processing..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Pay ${amount}
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          By completing this payment, you agree to our terms and conditions.
        </p>
      </CardContent>
    </Card>
  );
}