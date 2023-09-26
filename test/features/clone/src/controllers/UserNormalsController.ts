import core from "@nestia/core";
import * as nest from "@nestjs/common";
import typia from "typia";

@nest.Controller("users/normals")
export class UserNormalsController {
    @core.TypedRoute.Get()
    public async get(
        @core.TypedQuery() query: IAuthentication.IQuery,
    ): Promise<INormal.IPublicProfile> {
        query;
        return typia.random<INormal.IPublicProfile>();
    }

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
    export interface IQuery {
        oauth: OuathType;
    }
}
