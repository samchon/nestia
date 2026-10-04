import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebSocketAcceptor } from "tgrid";

import { ISocketCloneCalculator } from "../../../../structures/options/socket_calculator_clone/ISocketCloneCalculator";
import { ISocketCloneListener } from "../../../../structures/options/socket_calculator_clone/ISocketCloneListener";
import { ISocketClonePrecision as Precision } from "../../../../structures/options/socket_calculator_clone/ISocketClonePrecision";

export function SocketCloneCalculatorControllerBase(path: string) {
  @Controller(path)
  abstract class SocketCloneCalculatorControllerBase {
    @core.WebSocketRoute()
    public async connect(
      @core.WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<
        Precision,
        ISocketCloneCalculator,
        ISocketCloneListener
      >,
      @core.WebSocketRoute.Driver()
      driver: Driver<ISocketCloneListener>,
    ): Promise<void> {
      await acceptor.accept({
        plus: (x, y) => {
          const z: number = x + y;
          driver.on({ operator: "plus", x, y, z }).catch(() => {});
          return z;
        },
        minus: (x, y) => {
          const z: number = x - y;
          driver.on({ operator: "minus", x, y, z }).catch(() => {});
          return z;
        },
        multiply: (x, y) => {
          const z: number = x * y;
          driver.on({ operator: "multiply", x, y, z }).catch(() => {});
          return z;
        },
        divide: (x, y) => {
          const z: number = x / y;
          driver.on({ operator: "divide", x, y, z }).catch(() => {});
          return z;
        },
      });
    }
  }
  return SocketCloneCalculatorControllerBase;
}
