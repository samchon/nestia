import { WebSocketRoute } from "@nestia/core";
import { WebSocketAcceptor } from "tgrid";

import { ICalcConfigWebsocket } from "../interfaces/ICalcConfigWebsocket";
import { ICalcEventListenerWebsocket } from "../interfaces/ICalcEventListenerWebsocket";
import { ISimpleCalculatorWebsocket } from "../interfaces/ISimpleCalculatorWebsocket";
import { CalculateControllerBase } from "./CalculateControllerBase";

export class CalculateController extends CalculateControllerBase(
  "websocket/calculate",
) {
  @WebSocketRoute("simple")
  public async simple(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      ICalcConfigWebsocket,
      ISimpleCalculatorWebsocket,
      ICalcEventListenerWebsocket
    >,
  ): Promise<void> {
    await super.simple(acceptor);
  }
}
