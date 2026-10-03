import core from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("http_rich/clone/native/date")
export class CloneNativeDateController {
  @core.TypedRoute.Get()
  public get(): CloneNativeIDateDefined {
    return {
      string: new Date().toISOString(),
      date: new Date(),
    };
  }
}

interface CloneNativeIDateDefined {
  /** @format date-time */
  string: string;

  date: Date;
}
