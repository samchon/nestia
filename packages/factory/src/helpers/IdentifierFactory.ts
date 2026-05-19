import { SyntaxKind } from "../constants/SyntaxKind";
import { createIdentifier } from "../factory/literals/createIdentifier";
import { createStringLiteral } from "../factory/literals/createStringLiteral";
import { createElementAccessChain } from "../factory/expressions/createElementAccessChain";
import { createElementAccessExpression } from "../factory/expressions/createElementAccessExpression";
import { createPropertyAccessChain } from "../factory/expressions/createPropertyAccessChain";
import { createPropertyAccessExpression } from "../factory/expressions/createPropertyAccessExpression";
import { createParameterDeclaration } from "../factory/declarations/createParameterDeclaration";
import { createToken } from "../factory/tokens/createToken";
import type { Node } from "../structures/Node";

import { TypeFactory } from "./TypeFactory";

// Conservative "is this string a syntactically valid JavaScript variable
// name?" test, inlined to avoid pulling in @typia/utils' full namespace from
// an ESM bundle that only exposes a `default` export.
const VARIABLE_REGEX = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const isVariableName = (str: string): boolean => VARIABLE_REGEX.test(str);

/**
 * Identifier and member-access helpers. Replaces the legacy `@typia/core`
 * `IdentifierFactory` nestia previously depended on; the surface kept here is
 * the subset nestia generators actually call (`access`, `parameter`).
 */
export namespace IdentifierFactory {
  /** Build an identifier or string literal depending on whether `name` is a
   *  valid JavaScript identifier. */
  export const identifier = (name: string): Node =>
    isVariableName(name) ? createIdentifier(name) : createStringLiteral(name);

  /** Member access on `input` by `key`. Falls back to element access when
   *  the key is not a valid identifier. */
  export const access = (input: Node, key: string, chain?: boolean): Node => {
    const postfix = identifier(key);
    const isElement = postfix.kind === SyntaxKind.StringLiteral;
    if (chain === true) {
      const dot = createToken(SyntaxKind.QuestionDotToken);
      return isElement
        ? createElementAccessChain(input, dot, postfix)
        : createPropertyAccessChain(input, dot, postfix);
    }
    return isElement
      ? createElementAccessExpression(input, postfix)
      : createPropertyAccessExpression(input, postfix);
  };

  /** Recover the dotted name of a property/element-access chain. */
  export const getName = (input: Node): string => {
    if (input.kind === SyntaxKind.Identifier) {
      const escaped = (input as { escapedText?: string }).escapedText;
      if (typeof escaped === "string") return escaped;
      return (input as { text?: string }).text ?? "";
    }
    if (input.kind === SyntaxKind.PropertyAccessExpression) {
      const expr = (input as { expression?: Node }).expression;
      const name = (input as { name?: Node }).name;
      return name ? `${expr ? getName(expr) : ""}.${getName(name)}` : "";
    }
    if (input.kind === SyntaxKind.ElementAccessExpression) {
      const expr = (input as { expression?: Node }).expression;
      const arg = (input as { argumentExpression?: Node }).argumentExpression;
      return arg ? `${expr ? getName(expr) : ""}[${getName(arg)}]` : "";
    }
    return "unknown";
  };

  /** Parameter declaration with default `any` type when the caller omits one. */
  export const parameter = (
    name: string | Node,
    type?: Node,
    init?: Node,
  ): Node => {
    const isQuestionToken =
      (init as { kind?: number } | undefined)?.kind === SyntaxKind.QuestionToken;
    return createParameterDeclaration(
      undefined,
      undefined,
      name,
      isQuestionToken ? createToken(SyntaxKind.QuestionToken) : undefined,
      type ?? TypeFactory.keyword("any"),
      isQuestionToken ? undefined : init,
    );
  };
}
