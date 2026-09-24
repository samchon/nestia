import core from "@nestia/core";
import { Controller, Param } from "@nestjs/common";

/**
 * A controller whose only path is a wildcard. Its MCP tool is named apart from
 * any path, so the SDK still composes it.
 */
@Controller("assets/*rest")
export class WildcardController {
  @core.TypedRoute.Get()
  public get(@Param("rest") rest: string[]): string {
    return rest.join(",");
  }

  @core.McpRoute("echo_asset")
  public async echo(
    @core.McpRoute.Params() params: IEchoAsset,
  ): Promise<IEchoAsset> {
    return params;
  }
}

export interface IEchoAsset {
  name: string;
}
