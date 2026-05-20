import { nts } from "./nts";

export { nts } from "./nts";
export { NodeFlags } from "./constants/NodeFlags";
export { SyntaxKind } from "./constants/SyntaxKind";
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

// High-level helpers that wrap the factory primitives. These replace the
// legacy `@typia/core` helpers (IdentifierFactory, LiteralFactory, etc.)
// nestia generators previously imported, so nothing in nestia source needs
// to reach into `@typia/core` for AST construction anymore.
export { ExpressionFactory } from "./helpers/ExpressionFactory";
export { FormatCheatSheet } from "./helpers/FormatCheatSheet";
export { IdentifierFactory } from "./helpers/IdentifierFactory";
export { LiteralFactory } from "./helpers/LiteralFactory";
export { StatementFactory } from "./helpers/StatementFactory";
export { TypeFactory } from "./helpers/TypeFactory";

export default nts;
