import ts from "typescript";

import { IReflectImport } from "./IReflectImport";
import { IReflectMcpOperationParameter } from "./IReflectMcpOperationParameter";
import { IReflectType } from "./IReflectType";

/**
 * Reflected operation metadata for a method decorated with `@McpRoute`.
 *
 * Produced by {@link ReflectMcpOperationAnalyzer.analyze}; consumed by
 * {@link TypedMcpRouteAnalyzer.analyze} to produce the final
 * {@link ITypedMcpRoute}.
 */
export interface IReflectMcpOperation {
  protocol: "mcp";
  name: string;
  toolName: string;
  title: string | null;
  toolDescription: string | null;
  inputSchema: object;
  outputSchema: object | null;
  annotations: IReflectMcpOperation.IAnnotations | null;
  function: Function;
  parameters: IReflectMcpOperationParameter[];
  returnType: IReflectType | null;
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: ts.JSDocTagInfo[];
}

export namespace IReflectMcpOperation {
  export interface IAnnotations {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  }
}
