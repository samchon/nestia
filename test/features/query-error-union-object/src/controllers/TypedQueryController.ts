import { TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";

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
