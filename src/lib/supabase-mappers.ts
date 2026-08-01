import { Customer, Quote, QuoteItem } from "./types";

export interface CustomerRow {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
}

export interface QuoteItemRow {
  id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
}

export interface QuoteRow {
  id: string;
  quote_number: string;
  customer_id: string | null;
  status: Quote["status"];
  quote_date: string;
  quote_items: QuoteItemRow[] | null;
}

export function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
  };
}

export function mapQuoteItem(row: QuoteItemRow): QuoteItem {
  return {
    id: row.id,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
  };
}

export function mapQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    customerId: row.customer_id ?? "",
    status: row.status,
    createdAt: row.quote_date,
    items: (row.quote_items ?? []).map(mapQuoteItem),
  };
}
