import core from "@nestia/core";
import { Controller } from "@nestjs/common";

export interface Client {
  name: string;
}

export interface CallToolResult {
  message: string;
}

/**
 * MCP fixture whose DTO names intentionally collide with MCP SDK exports.
 *
 * @author wildduck - https://github.com/wildduck2
 */
@Controller()
export class ImportAliasController {
  /** Echo a client-like DTO to exercise generated import aliasing. */
  @core.McpRoute({ name: "echo_client" })
  public async echoClient(
    @core.McpRoute.Params() params: Client,
  ): Promise<CallToolResult> {
    return { message: params.name };
  }
}
