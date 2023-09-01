import { MetadataFactory } from "typia/lib/factories/MetadataFactory";

import { IRoute } from "./IRoute";

export interface ISwaggerError extends MetadataFactory.IError {
    route: IRoute;
    from: string;
}
