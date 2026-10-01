import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { ICalculatorQuery } from "../structures/ICalculatorQuery";
import { IListenerQuery } from "../structures/IListenerQuery";
import { IPrecisionQuery } from "../structures/IPrecisionQuery";
import { IQueryQuery } from "../structures/IQueryQuery";

@Controller("query/calculate")
export class CalculateController {
  @core.WebSocketRoute(":id")
  public async connect(
    @core.WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
    @core.WebSocketRoute.Acceptor()
    adaptor: WebSocketAcceptor<
      IPrecisionQuery,
      ICalculatorQuery,
      IListenerQuery
    >,
    @core.WebSocketRoute.Driver()
    driver: Driver<IListenerQuery>,
    @core.WebSocketRoute.Query() query: IQueryQuery,
  ): Promise<void> {
    await adaptor.accept({
      getId: () => id,
      getQuery: () => query,
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
