export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

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
