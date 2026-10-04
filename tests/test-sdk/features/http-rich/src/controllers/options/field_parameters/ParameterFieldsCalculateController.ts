import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import { Driver, WebSocketAcceptor } from "tgrid";
import { tags } from "typia";

import { IParameterFieldsCalculator } from "../../../structures/options/field_parameters/IParameterFieldsCalculator";
import { IParameterFieldsListener } from "../../../structures/options/field_parameters/IParameterFieldsListener";
import { IParameterFieldsPrecision } from "../../../structures/options/field_parameters/IParameterFieldsPrecision";

@Controller("http_rich/options/field_parameters/param/calculate")
export class ParameterFieldsCalculateController {
  @core.WebSocketRoute(":id")
  public async connect(
    @core.WebSocketRoute.Param("id") id: string & tags.Format<"uuid">,
    @core.WebSocketRoute.Acceptor()
    adaptor: WebSocketAcceptor<
      IParameterFieldsPrecision,
      IParameterFieldsCalculator,
      IParameterFieldsListener
    >,
    @core.WebSocketRoute.Driver()
    driver: Driver<IParameterFieldsListener>,
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
