import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

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
