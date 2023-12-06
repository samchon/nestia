import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IDateDefined } from "@api/lib/structures/IDateDefined";

@Controller("date")
export class DateController {
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
