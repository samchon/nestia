import { SwaggerCustomizer, TypedParam, TypedRoute } from "@nestia/core";
import { Controller, Param } from "@nestjs/common";
import { tags } from "typia";

import { SelectorParam } from "../decorators/SelectorParam";

@Controller("custom")
export class CustomController {
  @SwaggerCustomizer((props: SwaggerCustomizer.IProps) => {
    props.swagger.openapi = "3.0.11";
    props.route.description = "This is a custom description";
    (props.route as any)["x-special-symbol"] = "Something Special";

    const neighbor = props.get({
      method: "get",
      path: "custom/:id/normal",
    });
    if (neighbor) (neighbor as any)["x-special-symbol"] = "Something Normal";
  })
  @TypedRoute.Get(":key/:value/customize")
  public customize(
    @TypedParam("key")
    __key: number,
    @SelectorParam(() => CustomController.prototype.normal)
    @Param("value")
    __value: string,
  ): string {
    return `{ ${__key}: ${__value} }`;
  }

  @TypedRoute.Get(":id/normal")
  public normal(@TypedParam("id") id: string & tags.Format<"uuid">): string {
    return id.toString();
  }
}
