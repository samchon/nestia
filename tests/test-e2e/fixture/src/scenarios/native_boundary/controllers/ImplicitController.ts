import core from "@nestia/core";
import { Controller, Request } from "@nestjs/common";
import { tags } from "typia";
import { v4 } from "uuid";

/**
 * Preserves the original inferred SDK response and ignored request input.
 *
 * @evidence contracts/common.md#principled-implementation The original store infers an object Promise and update infers void instead of using an explicit response type.
 * @evidence contracts/common.md#clear-and-simple-design Two stateless methods preserve both inferred return branches in one controller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
 * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
 */
@Controller("native_boundary/implicit")
export class TypedBodyControlleer {
  @core.TypedRoute.Post()
  /**
   * Stores an article using its original inferred response.
   *
   * @evidence contracts/common.md#principled-implementation Original title/body input is echoed with a fresh UUID while the Nest Request parameter remains outside the SDK request.
   * @evidence contracts/common.md#clear-and-simple-design One handler preserves original inline input and return inference.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
   * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
   */
  public async store(
    @Request() request: any,
    @core.TypedBody()
    input: {
      title: string;
      body: string;
    },
  ) {
    request;
    return {
      ...input,
      id: v4(),
    };
  }

  @core.TypedRoute.Put(":id")
  /**
   * Updates an article using the original inferred void return.
   *
   * @evidence contracts/common.md#principled-implementation UUID parameter and inline body are consumed but no result is returned, preserving the inferred void branch.
   * @evidence contracts/common.md#clear-and-simple-design One handler preserves the original update contract.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Original source declarations and public decorators retain their meaning; no fabricated metadata or name-dependent product branches are used.
   * @evidence contracts/common.md#meaningful-documentation The comment states the source distinction this compiled input preserves.
   */
  public async update(
    @core.TypedParam("id") id: string & tags.Format<"uuid">,
    @core.TypedBody()
    input: {
      title: string;
      body: string;
    },
  ) {
    id;
    input;
  }
}
