import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebAcceptor } from "tgrid";
import { tags } from "typia";

import { ICalculator } from "@api/lib/structures/ICalculator";
import { IListener } from "@api/lib/structures/IListener";
import { IPrecision } from "@api/lib/structures/IPrecision";

@Controller("calculate")
export class CalculateController {
  @core.WebSocketRoute(":id")
  public async connect(
    @core.WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
    @core.WebSocketRoute.Acceptor()
    adaptor: WebAcceptor<IPrecision, ICalculator, IListener>,
    @core.WebSocketRoute.Driver()
    driver: Driver<IListener>,
  ): Promise<void> {
    console.log({
      id,
    });
    await adaptor.accept({
      getId: () => id,
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
