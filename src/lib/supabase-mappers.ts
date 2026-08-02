import { Customer, Product, Quote, QuoteItem, TelegramOrder } from "./types";

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

export interface ProductRow {
  id: string;
  name: string;
  unit_price: number | string;
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    unitPrice: Number(row.unit_price),
  };
}

export interface TelegramOrderRow {
  id: string;
  chat_id: number;
  username: string | null;
  first_name: string | null;
  product_name: string;
  quantity: number | string;
  unit_price: number | string;
  total: number | string;
  status: TelegramOrder["status"];
  created_at: string;
}

export function mapTelegramOrder(row: TelegramOrderRow): TelegramOrder {
  return {
    id: row.id,
    chatId: row.chat_id,
    username: row.username,
    firstName: row.first_name,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
  };
}
