import ts from "typescript";

import { INestiaConfig } from "../INestiaConfig";
import { IErrorReport } from "./IErrorReport";
import { INormalizedInput } from "./INormalizedInput";

export interface INestiaProject {
    config: INestiaConfig;
    input: INormalizedInput;
    checker: ts.TypeChecker;
    errors: IErrorReport[];
    warnings: IErrorReport[];
}
