import ts from "typescript";

import { INestiaConfig } from "../INestiaConfig";
import { INestiaSdkInput } from "./INestiaSdkInput";
import { IReflectOperationError } from "./IReflectOperationError";

export interface INestiaProject {
  config: INestiaConfig;
  input: INestiaSdkInput;
  checker: ts.TypeChecker;
  errors: IReflectOperationError[];
  warnings: IReflectOperationError[];
}
