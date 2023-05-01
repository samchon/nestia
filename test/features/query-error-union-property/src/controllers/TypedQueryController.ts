import { Controller } from "@nestjs/common";

import {
    TypedQuery,
    TypedRoute,
} from "../../../../../packages/core/src/module";

@Controller("query")
export class TypedQueryController {
    @TypedRoute.Get()
    public query(@TypedQuery() query: IUnionProperty): void {
        query;
    }
}

interface IUnionProperty {
    property: string | number;
}
