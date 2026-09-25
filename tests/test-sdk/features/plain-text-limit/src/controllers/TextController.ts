import core from "@nestia/core";
import { Controller } from "@nestjs/common";

export interface ITextLength {
  length: number;
}

@core.EncryptedController("text", {
  key: "A".repeat(32),
  iv: "B".repeat(16),
})
export class TextController {
  @core.TypedRoute.Post("plain")
  public plain(@core.PlainBody() body: string): ITextLength {
    return { length: body.length };
  }

  @core.EncryptedRoute.Post("encrypted")
  public encrypted(@core.EncryptedBody() body: { value: string }): ITextLength {
    return { length: body.value.length };
  }
}

@Controller("health")
export class HealthController {
  @core.TypedRoute.Get()
  public get(): void {}
}
