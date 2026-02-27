'use client';

import { Company, PaymentMethod } from '@/lib/data';
import { SlidingNumber } from './sliding-number';
import { TextMorph } from './text-morph';
import { cn } from '@/lib/utils';
import { Squircle } from './squircle';
import { motion, AnimatePresence } from 'motion/react';

export type CardLayout = 'company' | 'payment' | 'none';
export type SendingState = 'idle' | 'sending' | 'sent';

type PaymentCardProps = {
  company: Company;
  paymentMethod: PaymentMethod;
  amount: number;
  layout: CardLayout;
  isReceiver?: boolean;
  receiverDelivery?: string;
  sendingState?: SendingState;
  dimAmount?: boolean;
};

// How much of the colored card is visible above the white card (header row height)
const HEADER_PEEK = 40;
// Extra body hidden behind the white card for a clean overlap
const HEADER_OVERLAP = 28;

const cardSpring = { type: 'spring' as const, duration: 0.45, bounce: 0 };

export function PaymentCard({
  company,
  paymentMethod,
  amount,
  layout,
  isReceiver = false,
  receiverDelivery,
  sendingState = 'idle',
  dimAmount = false,
}: PaymentCardProps) {
  const isPerson = !!company.isCustomer;
  const isCompanyHeader = layout === 'company';
  const isPaymentHeader = layout === 'payment';

  const headerItem = isCompanyHeader ? company : paymentMethod;
  const bodyItem = isCompanyHeader ? paymentMethod : company;

  const headerBackground = ('gradient' in headerItem && headerItem.gradient)
    ? headerItem.gradient
    : headerItem.color;
  const headerName = isPaymentHeader && paymentMethod.last4
    ? `${headerItem.displayName} ${paymentMethod.last4}`
    : headerItem.displayName;
  const headerIcon = headerItem.icon;

  const bodyName = bodyItem.displayName;
  const bodyAccountInfo = isCompanyHeader && paymentMethod.last4
    ? `••${paymentMethod.last4}`
    : isCompanyHeader
    ? 'USD'
    : paymentMethod.last4 ? `••${paymentMethod.last4}` : null;

  const bodyIcon = bodyItem.icon;

  // Key for AnimatePresence — drives the roll transition
  // Person receiver: key is always 'delivery' so the content never rolls
  const bodyKey = isPerson && isReceiver
    ? 'delivery'
    : isReceiver
      ? sendingState
      : sendingState === 'idle' ? 'body' : sendingState;

  // ── Person card body content ────────────────────────────────────────────────
  const personBodyContent = isReceiver ? (
    // Receiver person: always show delivery text — no receiving/received state
    <span className="text-sm font-medium" style={{ color: '#596171' }}>
      {receiverDelivery ? `${receiverDelivery} in USD` : 'Received in 1–3 business days'}
    </span>
  ) : sendingState !== 'idle' ? (
    // Sender person: show sending/sent state
    <span className="text-sm font-medium" style={{ color: '#21252C' }}>
      {sendingState === 'sending' ? 'Sending' : 'Sent'}
    </span>
  ) : (
    // Sender idle: show payment method icon + name
    <div className="flex items-center gap-2.5">
      {('methodLogoPath' in bodyItem && bodyItem.methodLogoPath) || bodyItem.logoPath ? (
        <img
          src={('methodLogoPath' in bodyItem && bodyItem.methodLogoPath) || bodyItem.logoPath || ''}
          alt={bodyItem.name}
          className="w-8 h-8 object-contain"
          style={{ padding: 0, margin: 0 }}
        />
      ) : (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: '#E9EAEC', color: '#596171' }}>
          {bodyIcon}
        </div>
      )}
      <div className="flex flex-col">
        <TextMorph className="text-sm font-medium text-gray-900 leading-tight" as="span">
          {bodyName}
        </TextMorph>
        {bodyAccountInfo && (
          <span className="text-xs font-mono leading-tight" style={{ color: '#596171' }}>
            {bodyAccountInfo}
          </span>
        )}
      </div>
    </div>
  );

  // ── Company card body content ───────────────────────────────────────────────
  const companyBodyContent = isReceiver ? (
    sendingState !== 'idle' ? (
      <span className="text-sm font-medium" style={{ color: '#21252C' }}>
        {sendingState === 'sending' ? 'Receiving...' : 'Received'}
      </span>
    ) : isPaymentHeader ? (
      <div className="flex items-center gap-2.5">
        {bodyItem.logoPath ? (
          <img src={bodyItem.logoPath} alt={bodyItem.name} className="w-8 h-8 object-contain flex-shrink-0" style={{ padding: 0, margin: 0 }} />
        ) : (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ backgroundColor: bodyItem.color }}>
            {bodyIcon}
          </div>
        )}
        <div className="flex flex-col">
          <TextMorph className="text-sm font-medium text-gray-900 leading-tight" as="span">{bodyName}</TextMorph>
          <span className="text-xs leading-tight" style={{ color: '#596171' }}>{receiverDelivery ?? 'Receiving instantly'} in USD</span>
        </div>
      </div>
    ) : (
      <span className="text-sm font-medium" style={{ color: '#21252C' }}>
        {receiverDelivery ?? 'Receiving instantly'} in USD
      </span>
    )
  ) : sendingState === 'idle' ? (
    <div className="flex items-center gap-2.5">
      {('methodLogoPath' in bodyItem && bodyItem.methodLogoPath) || bodyItem.logoPath ? (
        <img src={('methodLogoPath' in bodyItem && bodyItem.methodLogoPath) || bodyItem.logoPath || ''} alt={bodyItem.name} className="w-8 h-8 object-contain" style={{ padding: 0, margin: 0 }} />
      ) : (
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold", isCompanyHeader ? "bg-blue-600" : "bg-emerald-600")} style={{ backgroundColor: bodyItem.color }}>
          {bodyIcon}
        </div>
      )}
      <div className="flex flex-col">
        <TextMorph className="text-sm font-medium text-gray-900 leading-tight" as="span">{bodyName}</TextMorph>
        {bodyAccountInfo && <span className="text-xs font-mono leading-tight" style={{ color: '#596171' }}>{bodyAccountInfo}</span>}
      </div>
    </div>
  ) : (
    <span className="text-sm font-medium" style={{ color: '#21252C' }}>
      {sendingState === 'sending' ? 'Sending' : 'Sent'}
    </span>
  );

  // ── Person card — no colored header, name + email in white card ─────────────
  if (isPerson) {
    // Receiver person: always 'delivery' so the content never cycles
    const personBodyKey = isReceiver ? 'delivery' : (sendingState === 'idle' ? 'idle' : sendingState);
    return (
      <div style={{ filter: 'drop-shadow(0 40px 40px rgba(53, 58, 68, 0.12))' }}>
        <Squircle cornerRadius={24} cornerSmoothing={1} className="w-64 bg-white overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            {/* Name + email header */}
            <div className="mb-4">
              <div className="text-sm font-semibold" style={{ color: '#21252C' }}>{company.name}</div>
              {company.email && (
                <div className="text-xs mt-0.5" style={{ color: '#596171' }}>{company.email}</div>
              )}
            </div>
            <div className="text-2xl font-light tabular-nums flex items-baseline mb-1" style={{ color: dimAmount ? '#B8C0CC' : '#111827', transition: 'color 0.3s ease' }}>
              $<SlidingNumber value={amount} />
            </div>
            {/* Body row / status */}
            <div style={{ overflow: 'hidden', position: 'relative', height: '24px' }}>
              <AnimatePresence mode="sync" initial={false}>
                <motion.div
                  key={personBodyKey}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '-100%' }}
                  transition={cardSpring}
                >
                  {personBodyContent}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Squircle>
      </div>
    );
  }

  // ── Company card — original layout with colored header peek ─────────────────
  return (
    <div>
      <div className="relative w-64" style={{ paddingTop: `${HEADER_PEEK}px` }}>

        {/* Colored header card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={headerItem.name}
            className="absolute left-0 right-0"
            style={{ top: 0, zIndex: 1 }}
            initial={{ y: HEADER_PEEK }}
            animate={{ y: 0 }}
            exit={{ y: HEADER_PEEK, transition: { duration: 0.15, ease: 'easeIn' } }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
          >
            <div className="w-64 overflow-hidden" style={{ background: headerBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <div className="px-5 pt-2 pb-3 flex items-center gap-2.5">
                {headerItem.logoPath ? (
                  <img src={headerItem.logoPath} alt={headerItem.name} className="w-6 h-6 object-contain" style={{ padding: 0, margin: 0 }} />
                ) : (
                  <span className="text-white text-lg font-semibold">{headerIcon}</span>
                )}
                <span className="text-white text-sm font-medium">{headerName}</span>
              </div>
              <div style={{ height: `${HEADER_OVERLAP}px` }} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* White body card */}
        <div className="relative" style={{ zIndex: 2, filter: 'drop-shadow(0 40px 40px rgba(53, 58, 68, 0.12))' }}>
          <Squircle cornerRadius={24} cornerSmoothing={1} className="w-64 bg-white overflow-hidden">
            <div className="p-6">
              <div className="text-2xl font-light tabular-nums flex items-baseline mb-1" style={{ color: dimAmount ? '#B8C0CC' : '#111827', transition: 'color 0.3s ease' }}>
                $<SlidingNumber value={amount} />
              </div>
              <div style={{ overflow: 'hidden', position: 'relative', height: '40px' }}>
                <AnimatePresence mode="sync" initial={false}>
                  <motion.div
                    key={bodyKey}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '-100%' }}
                    transition={cardSpring}
                  >
                    {companyBodyContent}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Squircle>
        </div>

      </div>
    </div>
  );
}
