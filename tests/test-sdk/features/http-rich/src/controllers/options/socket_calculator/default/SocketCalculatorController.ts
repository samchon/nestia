import { WebSocketRoute } from "@nestia/core";
import { WebSocketAcceptor } from "tgrid";

import { ISocketCalcConfig } from "../../../../structures/options/socket_calculator/ISocketCalcConfig";
import { ISocketCalcEventListener } from "../../../../structures/options/socket_calculator/ISocketCalcEventListener";
import { ISocketSimpleCalculator } from "../../../../structures/options/socket_calculator/ISocketSimpleCalculator";
import { SocketCalculatorControllerBase } from "./SocketCalculatorControllerBase";

export class SocketCalculatorController extends SocketCalculatorControllerBase(
  "http_rich/options/socket_calculator/default/calculate",
) {
  @WebSocketRoute("simple")
  public async simple(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      ISocketCalcConfig,
      ISocketSimpleCalculator,
      ISocketCalcEventListener
    >,
  ): Promise<void> {
    await super.simple(acceptor);
  }
}
