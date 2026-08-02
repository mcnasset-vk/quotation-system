export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export type OrderStatus = "New" | "Processed";

export interface Product {
  id: string;
  name: string;
  unitPrice: number;
}

export interface TelegramOrder {
  id: string;
  chatId: number;
  username: string | null;
  firstName: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  items: QuoteItem[];
  status: QuoteStatus;
  createdAt: string;
}

export function quoteTotal(quote: Pick<Quote, "items">): number {
  return quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}
