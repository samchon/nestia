import { Controller } from "@nestjs/common";

import {
    TypedQuery,
    TypedRoute,
} from "../../../../../packages/core/src/module";

@Controller("query")
export class TypedQueryController {
    @TypedRoute.Get()
    public query(@TypedQuery() query: IFirst | ISecond): void {
        query;
    }
}

interface IFirst {
    first: string;
}
interface ISecond {
    second: string;
}
