import { SwaggerCustomizer, TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { tags } from "typia";

@Controller("swagger")
export class SwaggerController {
  @SwaggerCustomizer(({ swagger, route, get }) => {
    swagger.openapi = "3.0.11";
    route.description = "This is a custom description";

    const neighbor = get({
      method: "get",
      path: "swagger/:id/normal",
    });
    if (neighbor) neighbor.description = "That is the normal description";
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
