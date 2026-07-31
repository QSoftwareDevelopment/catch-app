import type { SectorId } from '@/sectors/sectors';

import type { Conversation } from './types';

/**
 * Seed threads for demo mode.
 *
 * Written per sector because a plumber's inbox discussing a pizza order would undercut
 * the whole point of sector-aware software. These are the conversations Catch is meant
 * to have: a missed call answered automatically, a question about price, a booking.
 *
 * Timestamps are relative to load so the list always reads as recent activity rather
 * than a fixture from whenever it was written.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

type Script = {
  phone: string;
  origin: Conversation['origin'];
  status: Conversation['status'];
  startedAgo: number;
  lines: { author: 'catch' | 'owner' | 'customer'; body: string; afterMs: number }[];
};

/** The generic script, used for every trade-agnostic sector. */
function serviceScripts(job: string, price: string): Script[] {
  return [
    {
      phone: '+12896717110',
      origin: 'missed_call',
      status: 'active',
      startedAgo: 13 * HOUR,
      lines: [
        {
          author: 'catch',
          body: `Sorry we missed your call. This is Catch, the assistant for Northside. What can we help with?`,
          afterMs: 0,
        },
        { author: 'customer', body: `How much for ${job}?`, afterMs: 4 * MINUTE },
        {
          author: 'catch',
          body: `${job} is ${price}. Want me to book you in this week?`,
          afterMs: 5 * MINUTE,
        },
        { author: 'customer', body: 'Yes please, Thursday if you have it', afterMs: 9 * MINUTE },
        {
          author: 'catch',
          body: 'Thursday works. I have 9am or 1pm — which suits?',
          afterMs: 10 * MINUTE,
        },
      ],
    },
    {
      phone: '+13652285994',
      origin: 'missed_call',
      status: 'active',
      startedAgo: 14 * HOUR,
      lines: [
        {
          author: 'catch',
          body: 'Sorry we missed your call. This is Catch, the assistant for Northside. What can we help with?',
          afterMs: 0,
        },
        { author: 'customer', body: 'Are you open Saturday?', afterMs: 6 * MINUTE },
        {
          author: 'catch',
          body: 'We are, 9am to 2pm on Saturdays. Want me to hold a slot?',
          afterMs: 7 * MINUTE,
        },
      ],
    },
    {
      phone: '+14377076073',
      origin: 'inbound_text',
      status: 'active',
      startedAgo: 14 * HOUR,
      lines: [
        { author: 'customer', body: 'Hi, do you cover Burlington?', afterMs: 0 },
        {
          author: 'catch',
          body: 'We do — Burlington is inside our service area. What do you need looked at?',
          afterMs: 2 * MINUTE,
        },
        { author: 'customer', body: 'Great, I will call tomorrow', afterMs: 20 * MINUTE },
      ],
    },
    {
      phone: '+19055550142',
      origin: 'missed_call',
      status: 'closed',
      startedAgo: 3 * 24 * HOUR,
      lines: [
        {
          author: 'catch',
          body: 'Sorry we missed your call. This is Catch, the assistant for Northside. What can we help with?',
          afterMs: 0,
        },
        { author: 'customer', body: 'Wrong number, sorry', afterMs: 3 * MINUTE },
        { author: 'owner', body: 'No problem — have a good one.', afterMs: 12 * MINUTE },
      ],
    },
  ];
}

const RESTAURANT: Script[] = [
  {
    phone: '+12896717110',
    origin: 'missed_call',
    status: 'active',
    startedAgo: 13 * HOUR,
    lines: [
      {
        author: 'catch',
        body: 'Sorry we missed your call. This is Catch, the assistant for Northside. Ordering or booking a table?',
        afterMs: 0,
      },
      { author: 'customer', body: 'Ordering — 4 large pepperoni', afterMs: 3 * MINUTE },
      {
        author: 'catch',
        body: "4x Large Pepperoni — $120.00 each\nTotal $480.00\n\nReply YES to confirm and I'll send a payment link.",
        afterMs: 4 * MINUTE,
      },
      { author: 'customer', body: 'Yes', afterMs: 5 * MINUTE },
      {
        author: 'catch',
        body: "Great — pay here and we'll start making it:\nhttps://sandbox.square.link/u/AliMYYAD\n\nReady about 20 minutes after payment.",
        afterMs: 5 * MINUTE + 20_000,
      },
      { author: 'customer', body: 'Status of order', afterMs: 6 * MINUTE },
      {
        author: 'catch',
        body: "Your order's ready to pay — here's the link:\nhttps://sandbox.square.link/u/AliMYYAD\n\nOnce it's paid we'll start making it.",
        afterMs: 6 * MINUTE + 30_000,
      },
    ],
  },
  {
    phone: '+13652285994',
    origin: 'missed_call',
    status: 'active',
    startedAgo: 14 * HOUR,
    lines: [
      {
        author: 'catch',
        body: 'Sorry we missed your call. This is Catch, the assistant for Northside. Ordering or booking a table?',
        afterMs: 0,
      },
      { author: 'customer', body: 'Table for 6 on Friday at 7', afterMs: 5 * MINUTE },
      {
        author: 'catch',
        body: 'Friday 7pm for 6 — I can hold that. Name for the booking?',
        afterMs: 6 * MINUTE,
      },
    ],
  },
  {
    phone: '+14377076073',
    origin: 'inbound_text',
    status: 'active',
    startedAgo: 14 * HOUR,
    lines: [
      { author: 'customer', body: 'Do you have gluten free bases?', afterMs: 0 },
      {
        author: 'catch',
        body: 'We do — gluten free base is +$3 on any pizza. Want to order one?',
        afterMs: 2 * MINUTE,
      },
      { author: 'customer', body: 'Perfect thanks', afterMs: 15 * MINUTE },
    ],
  },
  {
    phone: '+19055550142',
    origin: 'missed_call',
    status: 'closed',
    startedAgo: 3 * 24 * HOUR,
    lines: [
      {
        author: 'catch',
        body: 'Sorry we missed your call. This is Catch, the assistant for Northside. Ordering or booking a table?',
        afterMs: 0,
      },
      { author: 'customer', body: 'Sorry, wrong number', afterMs: 4 * MINUTE },
      { author: 'owner', body: 'No worries — have a good night.', afterMs: 10 * MINUTE },
    ],
  },
];

const REAL_ESTATE: Script[] = serviceScripts('a viewing on the Lakeshore listing', 'free');

const SCRIPTS: Partial<Record<SectorId, Script[]>> = {
  restaurant: RESTAURANT,
  real_estate: REAL_ESTATE,
  hvac: serviceScripts('a furnace tune-up', '$149'),
  plumbing: serviceScripts('a drain unblock', '$120'),
  electrical: serviceScripts('a panel inspection', '$180'),
  auto_repair: serviceScripts('a brake job', '$340'),
  salon_spa: serviceScripts('a cut and colour', '$95'),
  fitness: serviceScripts('a monthly membership', '$59'),
};

export function demoConversations(sector: string | null | undefined): Conversation[] {
  const scripts = SCRIPTS[sector as SectorId] ?? serviceScripts('a call-out', '$120');

  return scripts.map((script, index) => {
    const start = Date.now() - script.startedAgo;
    const messages = script.lines.map((line, i) => ({
      id: `demo_msg_${index}_${i}`,
      author: line.author,
      body: line.body,
      at: new Date(start + line.afterMs).toISOString(),
    }));

    return {
      id: `demo_conv_${index}`,
      phone: script.phone,
      origin: script.origin,
      status: script.status,
      blocked: false,
      createdAt: new Date(start).toISOString(),
      updatedAt: messages[messages.length - 1]?.at ?? ago(script.startedAgo),
      messages,
    };
  });
}
