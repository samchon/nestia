import core from "@nestia/core";
import { Controller } from "@nestjs/common";

import { IAccount as Account, IAccount } from "../structures/IAccount";

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
