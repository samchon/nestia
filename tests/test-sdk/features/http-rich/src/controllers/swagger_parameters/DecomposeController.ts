import core from "@nestia/core";
import { Controller, Headers, Query } from "@nestjs/common";

import { IDecomposeHeaders } from "../../structures/swagger_parameters/IDecomposeHeaders";
import { IDecomposeQuery } from "../../structures/swagger_parameters/IDecomposeQuery";

@Controller("http_rich/swagger_parameters/decompose")
export class RichSwaggerDecomposeController {
  @core.TypedRoute.Get("typed-query")
  public typedQuery(@core.TypedQuery() input: IDecomposeQuery): void {
    input;
  }

  @core.TypedRoute.Get("nest-query")
  public nestQuery(@Query() input: IDecomposeQuery): void {
    input;
  }

  @core.TypedRoute.Get("typed-headers")
  public typedHeaders(@core.TypedHeaders() input: IDecomposeHeaders): void {
    input;
  }

  @core.TypedRoute.Get("nest-headers")
  public nestHeaders(@Headers() input: IDecomposeHeaders): void {
    input;
  }
}
