import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: MCP tool return types must be `void` or an object. A
 * primitive return type must be rejected.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("return_non_object")
  public async run(
    @core.McpRoute.Params() params: { value: number },
  ): Promise<string> {
    return String(params.value);
  }
}
