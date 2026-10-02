import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("body")
export class TypedBodyController {
  @core.TypedRoute.Post("generic")
  public async generic<T>(
    @core.TypedBody() input: ISomething<T>,
  ): Promise<ISomething<T>> {
    return input;
  }
}

interface ISomething<T> {
  value: T;
}
