import { Controller } from "@nestjs/common";

import {
    TypedQuery,
    TypedRoute,
} from "../../../../../packages/core/src/module";

@Controller("query")
export class TypedQueryController {
    @TypedRoute.Get()
    public query<T>(@TypedQuery() query: IUnionGeneric<T>): void {
        query;
    }
}

interface IUnionGeneric<T> {
    value: T;
}
