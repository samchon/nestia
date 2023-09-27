import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

@Controller("query")
export class TypedQueryController {
    @TypedRoute.Get()
    public query(@TypedQuery() query: IUnionLiteralQuery): void {
        query;
    }
}

interface IUnionLiteralQuery {
    literal: false | 1 | "two";
}
