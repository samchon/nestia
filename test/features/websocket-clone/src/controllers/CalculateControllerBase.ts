import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebSocketAcceptor } from "tgrid";

import { ICalculator } from "@api/lib/interfaces/ICalculator";
import { IListener } from "@api/lib/interfaces/IListener";
import { IPrecision } from "@api/lib/interfaces/IPrecision";

export function CalculateControllerBase(path: string) {
  @Controller(path)
  abstract class CalculateControllerBase {
    @core.WebSocketRoute()
    public async connect(
      @core.WebSocketRoute.Acceptor()
      acceptor: WebSocketAcceptor<IPrecision, ICalculator, IListener>,
      @core.WebSocketRoute.Driver()
      driver: Driver<IListener>,
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
  return CalculateControllerBase;
}
