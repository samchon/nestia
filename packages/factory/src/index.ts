import { nts } from "./nts";

export { nts } from "./nts";
export * as factory from "./factory/index";
export { TypeScriptFactory } from "./TypeScriptFactory";
export { TypeScriptPrinter } from "./printers/TypeScriptPrinter";
export type {
  CommentNode,
  EmitNode,
  Node,
  NodeArray,
  NodeProps,
} from "./structures";

export default nts;
