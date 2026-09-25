import core from "@nestia/core";
import { Controller, NotFoundException } from "@nestjs/common";

import { IEncryptedEcho } from "../api/structures/IEncryptedEcho";

@Controller("echo")
export class EncryptedEchoController {
  @core.EncryptedRoute.Get()
  public get(): IEncryptedEcho {
    return { value: "get" };
  }

  @core.EncryptedRoute.Post()
  public post(@core.EncryptedBody() body: IEncryptedEcho): IEncryptedEcho {
    return body;
  }

  @core.EncryptedRoute.Get("missing")
  public missing(): IEncryptedEcho {
    throw new NotFoundException("missing");
  }
}
