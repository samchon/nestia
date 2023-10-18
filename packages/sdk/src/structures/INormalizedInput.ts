import { RouteInfo, VersionValue } from "@nestjs/common/interfaces";

export interface INormalizedInput {
    include: INormalizedInput.IInput[];
    globalPrefix?: {
        prefix: string;
        exclude?: Array<string | RouteInfo>;
    };
    versioning?: {
        prefix: string;
        defaultVersion?: VersionValue;
    };
}
export namespace INormalizedInput {
    export interface IInput {
        paths: string[];
        file: string;
        controller?: Function;
    }
}
