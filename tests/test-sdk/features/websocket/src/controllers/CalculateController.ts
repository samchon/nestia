import { WebSocketRoute } from "@nestia/core";
import { WebSocketAcceptor } from "tgrid";

import { ICalcConfig } from "@api/lib/interfaces/ICalcConfig";
import { ICalcEventListener } from "@api/lib/interfaces/ICalcEventListener";
import { ISimpleCalculator } from "@api/lib/interfaces/ISimpleCalculator";

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
