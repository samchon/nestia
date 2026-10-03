import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IDateDefined } from "../../structures/date/IDateDefined";

@Controller("http_rich/date/date")
export class DateDateController {
  @core.TypedRoute.Get()
  public get(): IDateDefined {
    return {
      string: new Date().toISOString(),
      date: new Date(),
      date_with_tag: new Date(),
      date_but_union: new Date(),
    };
  }
}
