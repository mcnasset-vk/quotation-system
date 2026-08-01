import { NextRequest, NextResponse } from "next/server";
import { callEdgeFunction } from "@/lib/edge-functions";

export const runtime = "nodejs";

interface TelegramUpdate {
  message?: {
    text?: string;
    chat: { id: number };
    from?: { username?: string; first_name?: string };
  };
}

interface OrderResult {
  found: boolean;
  product?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

const WELCOME_MESSAGE =
  "Welcome! To get a quote, send me a product name and quantity, e.g.:\n\n" +
  '"Meal Plan, 2"\n"Private Room - Monthly Rate x1"';

const NOT_FOUND_MESSAGE = "Product not found, please contact customer service";

function parseOrder(text: string): { productName: string; quantity: number } {
  const trimmed = text.trim();

  const trailing = trimmed.match(/^(.*?)[\s,]+x?\s*(\d+)$/i);
  if (trailing) {
    return { productName: trailing[1].trim(), quantity: parseInt(trailing[2], 10) };
  }

  const leading = trimmed.match(/^(\d+)\s*x?\s+(.*)$/i);
  if (leading) {
    return { productName: leading[2].trim(), quantity: parseInt(leading[1], 10) };
  }

  return { productName: trimmed, quantity: 1 };
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQuote(result: OrderResult) {
  return [
    "<b>Quote</b>",
    "",
    `Product: ${result.product}`,
    `Quantity: ${result.quantity}`,
    `Unit Price: ${formatCurrency(result.unitPrice!)}`,
    `Total: ${formatCurrency(result.total!)}`,
  ].join("\n");
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as TelegramUpdate;
  const message = update.message;

  if (!message?.text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text.startsWith("/start") || text.startsWith("/help")) {
    await sendTelegramMessage(chatId, WELCOME_MESSAGE);
    return NextResponse.json({ ok: true });
  }

  const { productName, quantity } = parseOrder(text);

  if (!productName || quantity <= 0) {
    await sendTelegramMessage(
      chatId,
      'Please send a product name and quantity, e.g. "Meal Plan, 2"'
    );
    return NextResponse.json({ ok: true });
  }

  try {
    const result = await callEdgeFunction<OrderResult>("telegram-order", {
      method: "POST",
      body: {
        product_name: productName,
        quantity,
        chat_id: chatId,
        username: message.from?.username,
        first_name: message.from?.first_name,
        raw_message: text,
      },
    });

    await sendTelegramMessage(chatId, result.found ? formatQuote(result) : NOT_FOUND_MESSAGE);
  } catch {
    await sendTelegramMessage(chatId, NOT_FOUND_MESSAGE);
  }

  return NextResponse.json({ ok: true });
}
