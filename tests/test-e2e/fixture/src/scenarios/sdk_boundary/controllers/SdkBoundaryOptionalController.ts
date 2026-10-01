import { TypedBody, TypedHeaders, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { ISdkBoundaryOptional } from "../structures/ISdkBoundaryOptional";

/** Connects optional clone metadata to actual body, query and header handling. */
@Controller("sdk_boundary/optional")
export class SdkBoundaryOptionalController {
  @TypedRoute.Post()
  public echo(@TypedBody() input: ISdkBoundaryOptional): ISdkBoundaryOptional {
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
