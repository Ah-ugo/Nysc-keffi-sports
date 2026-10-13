import React, { useState } from 'react';
import { ShieldCheck, Lock, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { AppEnvironment, TransactionRecord } from '../types/models';

interface PaystackCheckoutModalProps {
  transaction: TransactionRecord;
  environment: AppEnvironment;
  onVerifySuccess: (channel: string) => Promise<void>;
  onSimulateWebhookAndVerify: (channel: string) => Promise<void>;
  onFailPayment: () => Promise<void>;
  onCancelPayment: () => Promise<void>;
}

export const PaystackCheckoutModal: React.FC<PaystackCheckoutModalProps> = ({
  transaction,
  environment,
  onVerifySuccess,
  onSimulateWebhookAndVerify,
  onFailPayment,
  onCancelPayment,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'card' | 'bank_transfer' | 'ussd'>('card');
  const [processingState, setProcessingState] = useState<
    'idle' | 'verifying' | 'duplicate_webhook_test' | 'failing'
  >('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCompletePayment = async (simulateDuplicateWebhook = false) => {
    setErrorMsg(null);
    setProcessingState(simulateDuplicateWebhook ? 'duplicate_webhook_test' : 'verifying');
    try {
      if (simulateDuplicateWebhook) {
        await onSimulateWebhookAndVerify(selectedChannel);
      } else {
        await onVerifySuccess(selectedChannel);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Payment failed. Please try again.'
      );
      setProcessingState('idle');
    }
  };

  const handleFail = async () => {
    setErrorMsg(null);
    setProcessingState('failing');
    try {
      await onFailPayment();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Payment failed.');
      setProcessingState('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Paystack Header */}
        <div className="bg-[#0B3B24] px-6 py-4 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-200">
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Paystack Checkout</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold">
                {environment === 'LIVE' ? 'LIVE' : 'TEST MODE'}
              </span>
            </div>
            <p className="text-sm font-semibold mt-0.5 truncate">
              {transaction.userEmail}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-300 block">Amount</span>
            <span className="text-lg font-bold font-mono tabular-nums text-[#D4AF37]">
              ₦{transaction.amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Prediction summary */}
        <div className="px-6 py-3.5 bg-stone-50 border-b border-stone-200 text-xs text-stone-600 space-y-1">
          <div className="flex justify-between">
            <span>Competition:</span>
            <span className="font-semibold text-stone-900">{transaction.competitionName}</span>
          </div>
          <div className="flex justify-between">
            <span>Selected Prediction:</span>
            <span className="font-semibold text-[#0B3B24]">{transaction.selectedOption}</span>
          </div>
          <div className="flex justify-between">
            <span>Paystack Reference:</span>
            <span className="font-mono text-stone-800">{transaction.paystackReference}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedChannel('card')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedChannel === 'card'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600'
                }`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('bank_transfer')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedChannel === 'bank_transfer'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600'
                }`}
              >
                Transfer
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('ussd')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedChannel === 'ussd'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600'
                }`}
              >
                USSD
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              disabled={processingState !== 'idle'}
              onClick={() => handleCompletePayment(false)}
              className="w-full h-11 rounded-xl bg-[#0B3B24] text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-[#082B1A] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {processingState === 'verifying' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying with Paystack...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Pay ₦{transaction.amount.toLocaleString()} & Confirm Entry</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={processingState !== 'idle'}
                onClick={() => handleCompletePayment(true)}
                className="py-2 px-3 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium cursor-pointer truncate"
              >
                {processingState === 'duplicate_webhook_test'
                  ? 'Testing...'
                  : 'Test Webhook'}
              </button>
              <button
                type="button"
                disabled={processingState !== 'idle'}
                onClick={handleFail}
                className="py-2 px-3 rounded-xl border border-red-200 text-red-800 bg-red-50 hover:bg-red-100 text-xs font-medium cursor-pointer truncate"
              >
                Simulate Fail
              </button>
            </div>

            <button
              type="button"
              disabled={processingState !== 'idle'}
              onClick={onCancelPayment}
              className="w-full py-1.5 text-xs text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-2.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0B3B24]" />
            <span>Secure Paystack Transaction</span>
          </span>
          <span>1 Entry Limit</span>
        </div>
      </div>
    </div>
  );
};
