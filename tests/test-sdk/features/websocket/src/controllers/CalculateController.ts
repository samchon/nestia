import { WebSocketRoute } from "@nestia/core";
import { WebSocketAcceptor } from "tgrid";

import { ICalcConfig } from "../api/interfaces/ICalcConfig";
import { ICalcEventListener } from "../api/interfaces/ICalcEventListener";
import { ISimpleCalculator } from "../api/interfaces/ISimpleCalculator";
import { CalculateControllerBase } from "./CalculateControllerBase";

export class CalculateController extends CalculateControllerBase("calculate") {
  @WebSocketRoute("simple")
  public async simple(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<
      ICalcConfig,
      ISimpleCalculator,
      ICalcEventListener
    >,
  ): Promise<void> {
    await super.simple(acceptor);
  }
}
