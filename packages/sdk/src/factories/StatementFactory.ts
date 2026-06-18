import {
  type Expression,
  NodeFlags,
  type TypeNode,
  type VariableStatement,
  factory,
} from "@ttsc/factory";

import { TypeFactory } from "./TypeFactory";

/** Variable-statement helpers. `constant` emits `const`, `mut` emits `let`. */
export namespace StatementFactory {
  export const mut = (props: {
    name: string;
    type?: TypeNode | undefined;
    initializer?: Expression | undefined;
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
    type?: TypeNode | undefined;
    value?: Expression | undefined;
  }): VariableStatement =>
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
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
