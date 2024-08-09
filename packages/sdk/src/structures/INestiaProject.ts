import ts from "typescript";

import { INestiaConfig } from "../INestiaConfig";
import { IErrorReport } from "./IErrorReport";
import { INestiaSdkInput } from "./INestiaSdkInput";

export interface INestiaProject {
  config: INestiaConfig;
  input: INestiaSdkInput;
  checker: ts.TypeChecker;
  errors: IErrorReport[];
  warnings: IErrorReport[];
}
