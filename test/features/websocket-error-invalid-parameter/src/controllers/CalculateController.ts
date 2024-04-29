import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebAcceptor } from "tgrid";

import { ICalculator } from "../api/structures/ICalculator";
import { IListener } from "../api/structures/IListener";
import { IPrecision } from "../api/structures/IPrecision";

@Controller("calculate")
export class CalculateController {
  @core.WebSocketRoute()
  public async connect(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebAcceptor<IPrecision, ICalculator, IListener>,
    @core.WebSocketRoute.Driver()
    driver: Driver<IListener>,
    @core.TypedHeaders() precision: IPrecision,
  ): Promise<void> {
    acceptor;
    driver;
    precision;
  }
}
