import { NodeFlags } from "../constants/NodeFlags";
import { createVariableDeclaration } from "../factory/declarations/createVariableDeclaration";
import { createVariableDeclarationList } from "../factory/declarations/createVariableDeclarationList";
import { createVariableStatement } from "../factory/declarations/createVariableStatement";
import type { Node } from "../structures/Node";

import { TypeFactory } from "./TypeFactory";

/**
 * Variable-statement helpers. `constant` emits `const`, `mut` emits `let`.
 * Mirrors the legacy `@typia/core` `StatementFactory` nestia generators call.
 */
export namespace StatementFactory {
  export const mut = (props: {
    name: string;
    type?: Node | undefined;
    initializer?: Node | undefined;
  }): Node =>
    createVariableStatement(
      undefined,
      createVariableDeclarationList(
        [
          createVariableDeclaration(
            props.name,
            undefined,
            props.type !== undefined
              ? props.type
              : props.initializer === undefined
                ? TypeFactory.keyword("any")
                : undefined,
            props.initializer,
          ),
        ],
        NodeFlags.Let,
      ),
    );

  export const constant = (props: {
    name: string;
    type?: Node | undefined;
    value?: Node | undefined;
  }): Node =>
    createVariableStatement(
      undefined,
      createVariableDeclarationList(
        [
          createVariableDeclaration(
            props.name,
            undefined,
            props.type,
            props.value,
          ),
        ],
        NodeFlags.Const,
      ),
    );
}
