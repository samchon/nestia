import { Controller } from "@nestjs/common";

import {
    TypedQuery,
    TypedRoute,
} from "../../../../../packages/core/src/module";

@Controller("query")
export class TypedQueryController {
    @TypedRoute.Get()
    public query(@TypedQuery() query: IUnionArray): void {
        query;
    }
}

interface IUnionArray {
    array: Array<string | number>;
}
