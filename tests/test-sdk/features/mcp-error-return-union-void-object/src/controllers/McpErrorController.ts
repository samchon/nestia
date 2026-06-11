import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: MCP tool return types must be exactly `void` or exactly
 * an object; a mixed `void | object` union is ambiguous on the wire and must be
 * rejected.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("return_union_void_object")
  public async run(
    @core.McpRoute.Params() params: { skip: boolean },
  ): Promise<{ ok: boolean } | void> {
    if (params.skip) return;
    return { ok: true };
  }
}
