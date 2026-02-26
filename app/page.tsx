'use client';

import { useState } from 'react';
import { ConfigPanel, DisplayMode } from '@/components/config-panel';
import { CardLayout } from '@/components/payment-card';
import { PaymentFlow } from '@/components/payment-flow';
import { companies, paymentMethods } from '@/lib/data';
import { GradientVariant } from '@/components/animated-gradient-bg';

export default function Home() {
  // Store amount in cents (200000 = $2,000.00)
  const [amountInCents, setAmountInCents] = useState(200000);
  const [senderCompany, setSenderCompany] = useState(companies.find(c => c.id === 'greenfield')!);
  const [receiverCompany, setReceiverCompany] = useState(companies.find(c => c.id === 'cactuspractice')!);
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]);
  const [layout, setLayout] = useState<CardLayout>('company');
  const [display, setDisplay] = useState<DisplayMode>('profiles');
  const [gradientVariant, setGradientVariant] = useState<GradientVariant>('pulse');
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="h-screen">
      <main className="h-full flex overflow-hidden">
        <PaymentFlow
          key={resetKey}
          amountInCents={amountInCents}
          onAmountChange={setAmountInCents}
          senderCompany={senderCompany}
          onSenderCompanyChange={setSenderCompany}
          receiverCompany={receiverCompany}
          onReceiverCompanyChange={setReceiverCompany}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          layout={layout}
          isModal={display === 'modal'}
          gradientVariant={gradientVariant}
        />
      </main>
      <ConfigPanel
        amountInCents={amountInCents}
        onAmountChange={setAmountInCents}
        senderCompany={senderCompany}
        onSenderCompanyChange={setSenderCompany}
        receiverCompany={receiverCompany}
        onReceiverCompanyChange={setReceiverCompany}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        layout={layout}
        onLayoutChange={setLayout}
        display={display}
        onDisplayChange={setDisplay}
        gradientVariant={gradientVariant}
        onGradientVariantChange={setGradientVariant}
        onReset={() => setResetKey((k) => k + 1)}
      />
    </div>
  );
}
