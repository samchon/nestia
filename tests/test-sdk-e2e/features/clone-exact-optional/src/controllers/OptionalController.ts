import { TypedBody, TypedHeaders, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IOptional } from "../structures/IOptional";

@Controller("optional")
export class OptionalController {
  @TypedRoute.Post()
  public echo(@TypedBody() input: IOptional): IOptional {
    return input;
  }

  @TypedRoute.Get()
  public inline(): { optional?: boolean; required: string } {
    return { required: "ok" };
  }

  @TypedRoute.Get("query")
  public query(
    @TypedQuery() input: { optional?: string; required: string },
    @TypedHeaders() headers: { "x-optional"?: string; "x-required": string },
  ): string {
    return input.required + headers["x-required"];
  }
}
