import ts from "typescript";

import { SdkTransformer } from "./transformers/SdkTransformer";

export const transform = (
  program: ts.Program,
): ts.TransformerFactory<ts.SourceFile> =>
  SdkTransformer.transformFile(program.getTypeChecker());
export default transform;
