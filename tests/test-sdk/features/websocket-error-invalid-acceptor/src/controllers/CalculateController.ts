import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("calculate")
export class CalculateController {
  @core.WebSocketRoute()
  public async connect(
    @core.WebSocketRoute.Acceptor()
    acceptor: any,
  ): Promise<void> {
    acceptor;
  }
}
