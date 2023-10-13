import core from "@nestia/core";
import { Controller } from "@nestjs/common";
import typia from "typia";

import { IForbidden } from "@api/lib/structures/IForbidden";
import { IMember } from "@api/lib/structures/IMember";
import { INotFound } from "@api/lib/structures/INotFound";

@Controller("members")
export class MembersController {
    @core.TypedException<IForbidden>(403)
    @core.TypedException<INotFound>(404)
    @core.TypedException<IForbidden.IExpired>(422)
    @core.TypedRoute.Post("login")
    public login(@core.TypedBody() input: IMember.ILogin): IMember {
        input;
        return typia.random<IMember>();
    }
}
