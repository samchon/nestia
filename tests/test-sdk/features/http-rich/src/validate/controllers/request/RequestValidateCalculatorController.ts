import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { IRequestValidateCalculator } from "../../structures/IRequestValidateCalculator";
import { IRequestValidateListener } from "../../structures/IRequestValidateListener";
import { IRequestValidatePrecision } from "../../structures/IRequestValidatePrecision";

@Controller("http_rich/options/request_validate/calculate")
export class RequestValidateCalculatorController {
  @core.WebSocketRoute(":id")
  public async connect(
    @core.WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
    @core.WebSocketRoute.Acceptor()
    adaptor: WebSocketAcceptor<
      IRequestValidatePrecision,
      IRequestValidateCalculator,
      IRequestValidateListener
    >,
    @core.WebSocketRoute.Driver()
    driver: Driver<IRequestValidateListener>,
  ): Promise<void> {
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
