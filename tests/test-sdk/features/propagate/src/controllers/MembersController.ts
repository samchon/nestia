import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IForbidden } from "../api/structures/IForbidden";
import { IMember } from "../api/structures/IMember";
import { INotFound } from "../api/structures/INotFound";

@Controller("members")
export class MembersController {
  @core.TypedException<IForbidden>(403)
  @core.TypedException<INotFound>(404)
  @core.TypedException<IForbidden.IExpired>(422)
  @core.EncryptedRoute.Post("login")
  public login(@core.EncryptedBody() input: IMember.ILogin): IMember {
    input;
    return typia.random<IMember>();
  }
}
