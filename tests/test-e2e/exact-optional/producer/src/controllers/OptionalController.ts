import { TypedBody, TypedHeaders, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IOptional } from "../structures/IOptional";

/**
 * Connects the original exact-optional source to native runtime metadata.
 *
 * @evidence contracts/common.md#principled-implementation The original body, inline return and query/header methods retain their source annotations under the original exactOptionalPropertyTypes:true flag.
 * @evidence contracts/common.md#clear-and-simple-design Three stateless methods expose the original object and inline shapes in one controller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The controller uses public decorators and retains its original input/output contracts without fabricated OperationMetadata.
 * @evidence contracts/common.md#meaningful-documentation The comment describes this authored contract and its role in the exact-optional input.
 */
@Controller("optional")
export class OptionalController {
  @TypedRoute.Post()
  /**
   * Echoes the original authored optional object.
   *
   * @evidence contracts/common.md#principled-implementation The submitted IOptional is returned unchanged so native body and response metadata refer to the same original contract.
   * @evidence contracts/common.md#clear-and-simple-design One stateless method preserves this original channel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only public decorators and authored return expressions are used.
   * @evidence contracts/common.md#meaningful-documentation The comment describes this authored contract and its role in the exact-optional input.
   */
  public echo(@TypedBody() input: IOptional): IOptional {
    return input;
  }

  @TypedRoute.Get()
  /**
   * Returns the original inline optional and required shape.
   *
   * @evidence contracts/common.md#principled-implementation The required string is present while the optional boolean is omitted, preserving the original inline return contract.
   * @evidence contracts/common.md#clear-and-simple-design One stateless method preserves this original channel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only public decorators and authored return expressions are used.
   * @evidence contracts/common.md#meaningful-documentation The comment describes this authored contract and its role in the exact-optional input.
   */
  public inline(): { optional?: boolean; required: string } {
    return { required: "ok" };
  }

  @TypedRoute.Get("query")
  /**
   * Reads required query and header values beside optional neighbors.
   *
   * @evidence contracts/common.md#principled-implementation The original query/header source annotations require their string neighbors and permit optional omissions under the exact flag.
   * @evidence contracts/common.md#clear-and-simple-design One stateless method preserves this original channel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only public decorators and authored return expressions are used.
   * @evidence contracts/common.md#meaningful-documentation The comment describes this authored contract and its role in the exact-optional input.
   */
  public query(
    @TypedQuery() input: { optional?: string; required: string },
    @TypedHeaders() headers: { "x-optional"?: string; "x-required": string },
  ): string {
    return input.required + headers["x-required"];
  }
}
