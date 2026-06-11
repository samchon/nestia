import core from "@nestia/core";
import { Controller } from "@nestjs/common";

/**
 * Compile-fail fixture: a single tool method may declare at most one
 * `@McpRoute.Params()` parameter. Two of them must be rejected by the nestia
 * transformer.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class McpErrorController {
  @core.McpRoute("multiple_params")
  public async run(
    @core.McpRoute.Params() a: { x: number },
    @core.McpRoute.Params() b: { y: number },
  ): Promise<{ ok: boolean }> {
    void a;
    void b;
    return { ok: true };
  }
}
