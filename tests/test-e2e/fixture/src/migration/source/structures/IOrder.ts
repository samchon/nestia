import { tags } from "typia";

export interface IOrder {
  id: string & tags.Format<"uuid">;
  buyer_id: string & tags.Format<"uuid">;
  line_items: IOrder.ILineItem[];
  payment: IOrder.Payment;
  delivery: IOrder.IDelivery;
  status: IOrder.Status;
  created_at: string & tags.Format<"date-time">;
}

export namespace IOrder {
  export type Status = "created" | "paid" | "shipped" | "cancelled";

  export interface ILineItem {
    sku: string;
    quantity: number & tags.Type<"uint32"> & tags.Minimum<1>;
    price: number & tags.Minimum<0>;
    options?: Record<string, string>;
  }

  export interface IDelivery {
    receiver: string;
    address: IAddress;
    memo?: string | null;
  }

  export interface IAddress {
    country: "KR" | "US" | "JP";
    postal_code: string;
    line1: string;
    line2?: string;
  }

  export type Payment = ICardPayment | IBankPayment | IPointPayment;

  export interface ICardPayment {
    method: "card";
    card_number: string & tags.Pattern<"^[0-9]{16}$">;
    installments?: number & tags.Type<"uint32"> & tags.Maximum<36>;
  }

  export interface IBankPayment {
    method: "bank";
    bank_code: "KB" | "NH" | "SH";
    account: string;
  }

  export interface IPointPayment {
    method: "point";
    amount: number & tags.Minimum<0>;
  }

  export interface ICreate {
    buyer_id: string & tags.Format<"uuid">;
    line_items: ILineItem[];
    payment: Payment;
    delivery: IDelivery;
  }

  export interface IStatus {
    status: Status;
    reason?: string;
  }
}
