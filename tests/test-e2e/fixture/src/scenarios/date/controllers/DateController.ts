import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IDateDefinedDate } from "../structures/IDateDefinedDate";

@Controller("date/date")
export class DateController {
  @core.TypedRoute.Get()
  public get(): IDateDefinedDate {
    return {
      string: new Date().toISOString(),
      date: new Date(),
      date_with_tag: new Date(),
      date_but_union: new Date(),
    };
  }
}
