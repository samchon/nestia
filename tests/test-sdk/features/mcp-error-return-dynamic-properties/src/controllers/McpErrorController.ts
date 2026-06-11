import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: MCP tool return types must not declare dynamic
 * properties. A `Record<string, T>` return must be rejected.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("return_dynamic_properties")
  public async run(
    @core.McpRoute.Params() params: { value: number },
  ): Promise<Record<string, number>> {
    return { value: params.value };
  }
}
