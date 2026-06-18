import {
  type Expression,
  type Identifier,
  NodeFlags,
  type TypeNode,
  type VariableStatement,
  factory,
} from "@ttsc/factory";

import { TypeFactory } from "./TypeFactory";

/**
 * Variable-statement helpers, mirroring `@typia/core`'s `StatementFactory`,
 * built on `@ttsc/factory` so no `typescript` runtime is bundled.
 */
export namespace StatementFactory {
  export const constant = (props: {
    name: string | Identifier;
    type?: TypeNode;
    value?: Expression;
  }): VariableStatement =>
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            props.name,
            undefined,
            props.type !== undefined
              ? props.type
              : props.value === undefined
                ? TypeFactory.keyword("any")
                : undefined,
            props.value,
          ),
        ],
        NodeFlags.Const,
      ),
    );
}
