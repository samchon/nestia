import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IExampleHeaders } from "../../structures/swagger_parameters/IExampleHeaders";
import { IExampleQuery } from "../../structures/swagger_parameters/IExampleQuery";

@Controller("http_rich/swagger_parameters/example")
export class RichSwaggerExampleController {
  @core.TypedRoute.Get("query")
  public query(
    @core.SwaggerExample.Parameter({ keyword: "nestia", page: 3 })
    @core.SwaggerExample.Parameter("typia", { keyword: "typia" })
    @core.SwaggerExample.Parameter("paged", { keyword: "ttsc", page: 7 })
    @core.TypedQuery()
    input: IExampleQuery,
  ): IExampleQuery {
    return input;
  }

  @core.TypedRoute.Get("headers")
  public headers(
    @core.SwaggerExample.Parameter({ "x-tenant": "samchon" })
    @core.TypedHeaders()
    input: IExampleHeaders,
  ): IExampleHeaders {
    return input;
  }
}
