import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("users/normals")
export class UserNormalsController {
    @core.TypedException<IAuthentication.OuathType>(404)
    @core.TypedRoute.Get(":normalId")
    public async getByNormalId(
        @core.TypedParam("normalId") normalId: string,
        @core.TypedQuery() query: INormal,
    ): Promise<INormal.IPublicProfile> {
        normalId;
        query;
        return typia.random<INormal.IPublicProfile>();
    }
}

interface INormal {
    type: "normal";
    id: string;
    name: string;
    created_at: string;
    other_attr: boolean;
}

namespace INormal {
    export type IPublicProfile = Pick<INormal, "type" | "id" | "name">;
}

namespace IAuthentication {
    export type OuathType = "kakao" | "github";
}
