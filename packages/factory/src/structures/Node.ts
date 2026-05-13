import type { EmitNode } from "./EmitNode";
import type { NodeArray } from "./NodeArray";

export interface Node {
  pos: number;
  end: number;
  kind: number;
  flags: number;
  modifierFlagsCache: number;
  transformFlags: number;
  emitNode?: EmitNode;

  text?: string;
  escapedText?: string;
  rawText?: string;
  singleQuote?: boolean;

  modifiers?: NodeArray;
  statements?: NodeArray;
  members?: NodeArray;
  parameters?: NodeArray;
  declarations?: NodeArray;
  elements?: NodeArray;
  properties?: NodeArray;
  typeArguments?: NodeArray;
  typeParameters?: NodeArray;
  templateSpans?: NodeArray;
  types?: NodeArray;
  heritageClauses?: NodeArray;

  name?: Node;
  propertyName?: Node;
  typeName?: Node;
  exprName?: Node;
  left?: Node;
  right?: Node;
  expression?: Node;
  initializer?: Node;
  objectAssignmentInitializer?: Node;
  operand?: Node;
  operator?: number;
  operatorToken?: Node;
  questionDotToken?: Node;
  questionToken?: Node;
  dotDotDotToken?: Node;
  equalsGreaterThanToken?: Node;
  asteriskToken?: Node;
  awaitModifier?: Node;
  endOfFileToken?: Node;
  literal?: Node;
  head?: Node;
  type?: Node;
  elementType?: Node;
  condition?: Node;
  whenTrue?: Node;
  whenFalse?: Node;
  body?: Node;
  thenStatement?: Node;
  elseStatement?: Node;
  statement?: Node;
  tryBlock?: Node;
  catchClause?: Node;
  finallyBlock?: Node;
  block?: Node;
  variableDeclaration?: Node;
  declarationList?: Node;
  importClause?: Node;
  moduleSpecifier?: Node;
  namedBindings?: Node;
  exportClause?: Node;

  arguments?: NodeArray;
  isTypeOnly?: boolean;
  multiLine?: boolean;
  fileName?: string;
}
