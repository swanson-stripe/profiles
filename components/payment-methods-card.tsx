'use client';

import { Company, PaymentMethod } from '@/lib/data';
import { SlidingNumber } from './sliding-number';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogDescription,
  MorphingDialogClose,
} from './motion-primitives/morphing-dialog';

type PaymentMethodsCardProps = {
  amount: number;
  company: Company;
  paymentMethod: PaymentMethod;
};

const paymentOptions = [
  {
    id: 'stripe',
    label: 'Pay with your Stripe balance',
    sublabel: 'Earn $40 in cashback',
    primary: true,
  },
  {
    id: 'bank',
    label: 'Manual bank transfer',
    sublabel: null,
    primary: false,
  },
  {
    id: 'stablecoins',
    label: 'Pay with stablecoins',
    sublabel: null,
    primary: false,
  },
  {
    id: 'card',
    label: 'Pay with card',
    sublabel: null,
    primary: false,
  },
];

export function PaymentMethodsCard({
  amount,
  company,
  paymentMethod,
}: PaymentMethodsCardProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Payment method</h2>

      <div className="space-y-3">
        {paymentOptions.map((option) => (
          <MorphingDialog
            key={option.id}
            transition={{ type: 'spring', bounce: 0.05, duration: 0.25 }}
          >
            <MorphingDialogTrigger
              className={`w-full px-6 py-5 rounded-2xl text-left transition-all ${
                option.primary
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <MorphingDialogTitle
                className={`text-lg font-semibold ${
                  option.primary ? 'text-white' : 'text-gray-700'
                }`}
              >
                {option.label}
              </MorphingDialogTitle>
              {option.sublabel && (
                <div
                  className={`text-sm mt-1 ${
                    option.primary ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {option.sublabel}
                </div>
              )}
            </MorphingDialogTrigger>

            <MorphingDialogContainer>
              <MorphingDialogContent className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8">
                <MorphingDialogClose />

                <MorphingDialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {option.label}
                </MorphingDialogTitle>

                <MorphingDialogDescription className="mt-6">
                  <div className="space-y-6">
                    {/* Payment Details */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Amount
                        </span>
                        <span className="text-3xl font-bold text-gray-900 tabular-nums">
                          $<SlidingNumber value={amount} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">To</span>
                        <span className="font-semibold text-gray-900">
                          {company.displayName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">From</span>
                        <span className="font-semibold text-gray-900">
                          {paymentMethod.displayName}
                        </span>
                      </div>
                    </div>

                    {/* Payment Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Account Details
                        </label>
                        <input
                          type="text"
                          placeholder="Enter account information"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {option.id === 'card' && (
                        <>
                          <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Card Number
                            </label>
                            <input
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                Expiry
                              </label>
                              <input
                                type="text"
                                placeholder="MM/YY"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                CVV
                              </label>
                              <input
                                type="text"
                                placeholder="123"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {option.id === 'stablecoins' && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Wallet Address
                          </label>
                          <input
                            type="text"
                            placeholder="0x..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      {option.id === 'bank' && (
                        <>
                          <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Routing Number
                            </label>
                            <input
                              type="text"
                              placeholder="123456789"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Account Number
                            </label>
                            <input
                              type="text"
                              placeholder="000123456789"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors">
                        Confirm Payment
                      </button>
                    </div>
                  </div>
                </MorphingDialogDescription>
              </MorphingDialogContent>
            </MorphingDialogContainer>
          </MorphingDialog>
        ))}
      </div>
    </div>
  );
}
