import core from "@nestia/core";
import { Controller, Query } from "@nestjs/common";

@Controller("optional-query")
export class OptionalQueryController {
  @core.TypedRoute.Post("field")
  public field(
    @Query("mode") mode: string | undefined,
    @core.TypedBody() body: { value: number },
    @Query("suffix") suffix: string | undefined,
  ): string {
    return `${mode ?? "none"}:${body.value}:${suffix ?? "none"}`;
  }

  @core.TypedRoute.Post("object")
  public object(
    @core.TypedQuery() query: { mode?: string } | undefined,
    @core.TypedBody() body: { value: number },
  ): string {
    return `${query?.mode ?? "none"}:${body.value}`;
  }

  @core.TypedRoute.Get("trailing")
  public trailing(
    @Query("mode") mode: string,
    @Query("suffix") suffix: string | undefined,
  ): string {
    return `${mode}:${suffix ?? "none"}`;
  }
}
