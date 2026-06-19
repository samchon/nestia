import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: `@McpRoute.Params()` must wrap an object type. A
 * primitive parameter type must be rejected.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("param_non_object")
  public async run(
    @core.McpRoute.Params() value: string,
  ): Promise<{ ok: boolean }> {
    void value;
    return { ok: true };
  }
}
