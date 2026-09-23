import core from "@nestia/core";
import { Controller, Headers, Query } from "@nestjs/common";

import { IDecomposeHeaders } from "@api/lib/structures/IDecomposeHeaders";
import { IDecomposeQuery } from "@api/lib/structures/IDecomposeQuery";

@Controller("decompose")
export class DecomposeController {
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
