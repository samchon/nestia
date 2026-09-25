import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("articles")
export class ArticleController {
  @core.SwaggerCustomizer((props) => {
    props.route.summary = "customized";
  })
  @core.TypedRoute.Delete(":id")
  public delete(@core.TypedParam("id") id: string): string {
    return id;
  }
}
