import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IAccount, IAccount as Account } from "../structures/IAccount";

@Controller("accounts")
export class AccountController {
  @core.TypedRoute.Get()
  public get(): Account {
    return {
      id: "account",
    };
  }

  @core.TypedRoute.Get("control")
  public control(): IAccount {
    return {
      id: "control",
    };
  }
}
