import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("import-type")
export class ImportTypeController {
  @TypedRoute.Get("envelope")
  public envelope(): IEnvelope<IGreeting> {
    return { message: "ok", data: { greeting: "hello" } };
  }

  @TypedRoute.Get("alias")
  public alias(): AliasEnvelope<IGreeting> {
    return { message: "ok", data: { greeting: "hello" } };
  }

  @TypedRoute.Get<
    import("./ImportTypeController").IEnvelope<
      import("./ImportTypeController").IGreeting
    >
  >("decorator-generic")
  public decoratorGeneric(): AliasEnvelope<IGreeting> {
    return { message: "ok", data: { greeting: "hello" } };
  }
}

export interface IEnvelope<T> {
  message: string;
  data: T | null;
}

export interface IGreeting {
  greeting: string;
}

type AliasEnvelope<T> = IEnvelope<T>;
