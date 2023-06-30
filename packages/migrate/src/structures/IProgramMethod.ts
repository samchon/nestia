import { ISwaggerRoute } from "./ISwaggerRoute";

export interface IProgramMethod {
    name: string;
    namespace: string;
    swagger: ISwaggerRoute;
}