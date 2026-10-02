import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { ICalculator } from "@api/lib/structures/ICalculator";

/**
 * A WebSocket route and an MCP tool, whose SDK functions import `tgrid` and
 * `@modelcontextprotocol/sdk`, so the distributed package must install both.
 */
@Controller("calculator")
export class CalculatorController {
  @core.WebSocketRoute("socket")
  public async socket(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<undefined, ICalculator, null>,
  ): Promise<void> {
    await acceptor.accept({ plus: (x, y) => x + y });
  }

  @core.McpRoute("plus")
  public async plus(
    @core.McpRoute.Params() params: ICalculator.IInput,
  ): Promise<ICalculator.IOutput> {
    return { value: params.x + params.y };
  }
}
