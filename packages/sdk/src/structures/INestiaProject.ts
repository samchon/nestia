import { INestiaConfig } from "../INestiaConfig";
import { INestiaSdkInput } from "./INestiaSdkInput";
import { IReflectOperationError } from "./IReflectOperationError";

/**
 * The state of one generation: the configuration, the analyzed input, and the
 * collected errors and warnings.
 *
 * @evidence contracts/common.md#principled-implementation The analyses append to the two lists and the generators run only when the error list is empty.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidence contracts/portability.md#os-neutral-implementation Configuration pathnames remain in INestiaConfig and controller source identities remain in INestiaSdkInput; this project record carries both unchanged without converting URL spelling into native identity.
 */
export interface INestiaProject {
  config: INestiaConfig;
  input: INestiaSdkInput;
  errors: IReflectOperationError[];
  warnings: IReflectOperationError[];
}
