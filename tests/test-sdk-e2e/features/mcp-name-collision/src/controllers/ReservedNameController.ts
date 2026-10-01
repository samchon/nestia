import core from "@nestia/core";
import { Controller } from "@nestjs/common";

export interface IEchoInput {
  message: string;
}

export interface IEchoOutput {
  message: string;
}

/**
 * MCP tools named after the identifiers the generated MCP SDK function declares
 * next to its `<method>.METADATA` reference, or after a global its body calls.
 */
@Controller()
export class ReservedNameController {
  @core.McpRoute("client")
  public async client(
    @core.McpRoute.Params() params: IEchoInput,
  ): Promise<IEchoOutput> {
    return { message: `client:${params.message}` };
  }

  @core.McpRoute("args")
  public async args(
    @core.McpRoute.Params() params: IEchoInput,
  ): Promise<IEchoOutput> {
    return { message: `args:${params.message}` };
  }

  @core.McpRoute("raw")
  public async raw(
    @core.McpRoute.Params() params: IEchoInput,
  ): Promise<IEchoOutput> {
    return { message: `raw:${params.message}` };
  }

  @core.McpRoute("result")
  public async result(
    @core.McpRoute.Params() params: IEchoInput,
  ): Promise<IEchoOutput> {
    return { message: `result:${params.message}` };
  }

  @core.McpRoute("JSON")
  public async JSON(
    @core.McpRoute.Params() params: IEchoInput,
  ): Promise<IEchoOutput> {
    return { message: `JSON:${params.message}` };
  }

  @core.McpRoute("first")
  public async first(
    @core.McpRoute.Params() params: IEchoInput,
  ): Promise<IEchoOutput> {
    return { message: `first:${params.message}` };
  }
}
