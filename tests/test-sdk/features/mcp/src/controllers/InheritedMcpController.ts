import core from "@nestia/core";
import { Controller } from "@nestjs/common";

export interface IInheritedMcpInput {
  a: number;
  b: number;
}

export interface IInheritedMcpResult {
  result: number;
}

export interface IInheritedMcpBaseInput {
  value: string;
}

export interface IInheritedMcpDerivedInput {
  value: number;
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

  /** Must be replaced by the derived tool metadata. */
  @core.McpRoute("base_override")
  public async override(
    @core.McpRoute.Params() params: IInheritedMcpBaseInput,
  ): Promise<IInheritedMcpResult> {
    return { result: params.value.length };
  }
}

@Controller()
export class InheritedMcpController extends InheritedMcpControllerBase {
  public async hidden(
    params: IInheritedMcpInput,
  ): Promise<IInheritedMcpResult> {
    return { result: params.a - params.b };
  }

  /** Return the derived input doubled. */
  @core.McpRoute("derived_override")
  public async override(
    @core.McpRoute.Params() params: IInheritedMcpDerivedInput,
  ): Promise<IInheritedMcpResult> {
    return { result: params.value * 2 };
  }
}
