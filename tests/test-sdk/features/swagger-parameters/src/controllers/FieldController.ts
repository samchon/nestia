import core from "@nestia/core";
import { Controller, Headers, Query } from "@nestjs/common";
import { tags } from "typia";

import { IAbsentFields } from "@api/lib/structures/IAbsentFields";
import { IExampleHeaders } from "@api/lib/structures/IExampleHeaders";

@Controller("field")
export class FieldController {
  @core.TypedRoute.Get(":id")
  public fields(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @Query("limit") limit: string,
    @Headers("x-trace") trace: string & tags.Format<"uuid">,
    @Headers("x-optional") optional?: string,
  ): void {
    id;
    limit;
    trace;
    optional;
  }

  @core.TypedRoute.Get(":id/combined")
  public combined(
    @core.TypedParam("id") id: string,
    @core.TypedHeaders() headers: IExampleHeaders,
    @Headers("x-trace") trace: string & tags.Format<"uuid">,
  ): void {
    id;
    headers;
    trace;
  }

  @core.TypedRoute.Post("absent")
  public absent(@core.TypedBody() input: IAbsentFields): IAbsentFields {
    return input;
  }
}
