import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

export interface IOrderQuery {
  page?: number;
}

@Controller("order")
export class OrderController {
  @core.TypedRoute.Post("field")
  public field(
    @Query("mode") mode: string | undefined,
    @core.TypedBody() body: { value: number },
  ): string {
    return `${mode ?? "none"}:${body.value}`;
  }

  @core.TypedRoute.Post("object")
  public object(
    @core.TypedQuery() query: IOrderQuery | undefined,
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
