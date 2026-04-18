import { IJsDocTagInfo } from "typia";

import { IReflectImport } from "./IReflectImport";
import { IReflectType } from "./IReflectType";

/**
 * Parameter descriptor for an MCP tool method. Reflected from
 * `"nestia/McpRoute/Parameters"` metadata plus compile-time type
 * information collected by the nestia transformer.
 */
export interface IReflectMcpOperationParameter {
  category: "params";
  name: string;
  index: number;
  type: IReflectType;
  imports: IReflectImport[];
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
}

export namespace IReflectMcpOperationParameter {
  /** @internal */
  export interface IPreconfigured {
    category: "params";
    index: number;
  }
}
