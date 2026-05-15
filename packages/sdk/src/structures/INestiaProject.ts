import { INestiaConfig } from "../INestiaConfig";
import { INestiaSdkInput } from "./INestiaSdkInput";
import { IReflectOperationError } from "./IReflectOperationError";

export interface INestiaProject {
  config: INestiaConfig;
  input: INestiaSdkInput;
  errors: IReflectOperationError[];
  warnings: IReflectOperationError[];
}
