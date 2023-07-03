import { IProgramController } from "./IProgramController";
import { ISwagger } from "./ISwagger";

export interface IAsset {
    swagger: ISwagger;
    controllers: IProgramController[];
    schemas: string[];
}
