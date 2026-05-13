import { TypeScriptFactory } from "../TypeScriptFactory";
import { NodeFlags } from "../constants/NodeFlags";
import { SyntaxKind } from "../constants/SyntaxKind";
import type { Node } from "../structures/Node";
import { NodePrinter } from "./internal/NodePrinter";

export class TypeScriptPrinter {
  private readonly printer: NodePrinter;

  public constructor(_options: TypeScriptPrinter.IPrinterOptions = {}) {
    this.printer = new NodePrinter();
  }

  public printFile(file: Node): string {
    return this.printer.printFile(file);
  }

  public printStatements(
    statements: readonly Node[],
    props: TypeScriptPrinter.IPrintStatementsProps = {},
  ): string {
    const file = TypeScriptFactory.createSourceFile(
      statements,
      props.endOfFileToken ??
        TypeScriptFactory.createToken(SyntaxKind.EndOfFileToken),
      props.flags ?? NodeFlags.None,
    );

    return (props.top ?? "") + this.printFile(file);
  }

  public printNode(_hint: unknown, node: Node, _sourceFile?: Node): string {
    return this.printer.printNode(node);
  }

  public static write(props: TypeScriptPrinter.IWriteProps): string {
    return new TypeScriptPrinter(props.printerOptions).printStatements(
      props.statements,
      props,
    );
  }
}

export namespace TypeScriptPrinter {
  export type IPrinterOptions = Record<string, unknown>;

  export interface IPrintStatementsProps {
    endOfFileToken?: Node;
    flags?: number;
    top?: string;
  }

  export interface IWriteProps extends IPrintStatementsProps {
    printerOptions?: IPrinterOptions;
    statements: readonly Node[];
  }
}
