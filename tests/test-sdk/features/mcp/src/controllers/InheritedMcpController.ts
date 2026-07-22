import core from "@nestia/core";
import { Controller } from "@nestjs/common";

export interface IInheritedMcpInput {
  a: number;
  b: number;
}

export interface IInheritedMcpResult {
  result: number;
}

export class InheritedMcpControllerBase {
  /** Return the product of two numbers. */
  @core.McpRoute("multiply")
  public async multiply(
    @core.McpRoute.Params() params: IInheritedMcpInput,
  ): Promise<IInheritedMcpResult> {
    return { result: params.a * params.b };
  }

  /** This MCP tool must be hidden by the derived override. */
  @core.McpRoute("hidden")
  public async hidden(
    @core.McpRoute.Params() params: IInheritedMcpInput,
  ): Promise<IInheritedMcpResult> {
    return { result: params.a + params.b };
  }
}

@Controller()
export class InheritedMcpController extends InheritedMcpControllerBase {
  public async hidden(
    params: IInheritedMcpInput,
  ): Promise<IInheritedMcpResult> {
    return { result: params.a - params.b };
  }
}
