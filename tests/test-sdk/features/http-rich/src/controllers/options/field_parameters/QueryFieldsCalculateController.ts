import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { IQueryFieldsCalculator } from "../../../structures/options/field_parameters/IQueryFieldsCalculator";
import { IQueryFieldsListener } from "../../../structures/options/field_parameters/IQueryFieldsListener";
import { IQueryFieldsPrecision } from "../../../structures/options/field_parameters/IQueryFieldsPrecision";
import { IQueryFieldsQuery } from "../../../structures/options/field_parameters/IQueryFieldsQuery";

@Controller("http_rich/options/field_parameters/query/calculate")
export class QueryFieldsCalculateController {
  @core.WebSocketRoute(":id")
  public async connect(
    @core.WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
    @core.WebSocketRoute.Acceptor()
    adaptor: WebSocketAcceptor<
      IQueryFieldsPrecision,
      IQueryFieldsCalculator,
      IQueryFieldsListener
    >,
    @core.WebSocketRoute.Driver()
    driver: Driver<IQueryFieldsListener>,
    @core.WebSocketRoute.Query() query: IQueryFieldsQuery,
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
