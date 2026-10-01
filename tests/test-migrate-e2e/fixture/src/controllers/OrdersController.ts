import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IOrder } from "../structures/IOrder";
import { IProblem } from "../structures/IProblem";

@Controller("orders")
export class OrdersController {
  /**
   * Create an order with union payment payload.
   *
   * @summary Create order
   * @tag Orders
   * @security bearer orders:write
   */
  @core.TypedException<IProblem>(409, "order already exists")
  @core.TypedRoute.Post()
  public create(@core.TypedBody() input: IOrder.ICreate): IOrder {
    return {
      id: "00000000-0000-0000-0000-000000000001",
      buyer_id: input.buyer_id,
      line_items: input.line_items,
      payment: input.payment,
      delivery: input.delivery,
      status: "created",
      created_at: new Date(0).toISOString(),
    };
  }

  /**
   * Read an order.
   *
   * @summary Read order
   * @tag Orders
   * @security bearer orders:read
   */
  @core.TypedRoute.Get(":id")
  public at(@core.TypedParam("id") id: string): IOrder {
    return {
      id,
      buyer_id: "00000000-0000-0000-0000-000000000002",
      line_items: [],
      payment: { method: "point", amount: 0 },
      delivery: {
        receiver: "tester",
        address: {
          country: "KR",
          postal_code: "00000",
          line1: "fixture",
        },
      },
      status: "created",
      created_at: new Date(0).toISOString(),
    };
  }

  /**
   * Change order status.
   *
   * @summary Change order status
   * @tag Orders
   * @security bearer orders:write
   */
  @core.TypedRoute.Patch(":id/status")
  public status(
    @core.TypedParam("id") id: string,
    @core.TypedBody() input: IOrder.IStatus,
  ): IOrder.IStatus {
    void id;
    return input;
  }
}
