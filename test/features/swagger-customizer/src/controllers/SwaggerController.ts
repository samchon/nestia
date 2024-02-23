import { SwaggerCustomizer, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

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
    if (neighbor) {
      neighbor.description = "That is the normal description";
      (neighbor as any)["x-special-symbol"] = "Something Normal";
    }
  })
  @TypedRoute.Get(":key/customize")
  public customize(@TypedParam("key") key: number): string {
    return key.toString();
  }

  @TypedRoute.Get(":id/normal")
  public normal(@TypedParam("id") id: string & tags.Format<"uuid">): string {
    return id.toString();
  }
}
