import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

export interface OptionalOrderQuery {
  page?: number;
}

@Controller("http_rich/options/parameter_order/order")
export class OptionalOrderController {
  @core.TypedRoute.Post("field")
  public field(
    @Query("mode") mode: string | undefined,
    @core.TypedBody() body: { value: number },
  ): string {
    return `${mode ?? "none"}:${body.value}`;
  }

  @core.TypedRoute.Post("object")
  public object(
    @core.TypedQuery() query: OptionalOrderQuery | undefined,
    @core.TypedBody() body: { value: number },
  ): string {
    return `${query?.page ?? "none"}:${body.value}`;
  }

  @core.TypedRoute.Post("reordered")
  public reordered(
    @core.TypedBody() body: { value: number },
    @Query("mode") mode?: string,
  ): string {
    return `${mode ?? "none"}:${body.value}`;
  }
}
