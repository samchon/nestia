import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { WebSocketAcceptor } from "tgrid";

import { ICalculator } from "../api/structures/ICalculator";
import { IListener } from "../api/structures/IListener";
import { IPrecision } from "../api/structures/IPrecision";

@Controller("calculate")
export class CalculateController {
  @core.WebSocketRoute()
  public async connect(
    @core.WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<IPrecision, ICalculator, IListener>,
    @core.WebSocketRoute.Driver() driver: any,
  ): Promise<void> {
    acceptor;
    driver;
  }
}
