import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

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
