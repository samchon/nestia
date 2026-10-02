import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver } from "tgrid";

import { IListener } from "../api/structures/IListener";

@Controller("calculate")
export class CalculateController {
  @core.WebSocketRoute()
  public async connect(
    @core.WebSocketRoute.Driver() driver: Driver<IListener>,
  ): Promise<void> {
    driver;
  }
}
