import { factory } from "@ttsc/factory";

import { TypeLiteralFactory } from "../factories/TypeLiteralFactory";
import ts from "../internal/ts";
import { FilePrinter } from "../utils/FilePrinter";
import { MapUtil } from "../utils/MapUtil";

export class NestiaMigrateImportProgrammer {
  private external_: Map<string, IClause> = new Map();
  private dtos_: Set<string> = new Set();

  public constructor() {}

  public empty(): boolean {
    return this.external_.size === 0 && this.dtos_.size === 0;
  }

  public external(props: MigrateImportProgrammer.IProps): string {
    const clause: IClause = MapUtil.take(this.external_)(props.library)(() => ({
      default: null,
      instances: new Set(),
    }));
    const name: string = props.name.split(".")[0]!;
    if (props.type === "default") clause.default = props.name;
    else clause.instances.add(name);
    return name;
  }

  public dto(name: string, namespace?: string): ts.TypeReferenceNode {
    const file: string = name.split(".")[0]!;
    this.dtos_.add(file);
    return factory.createTypeReferenceNode(
      namespace?.length
        ? factory.createQualifiedName(
            factory.createIdentifier(namespace),
            factory.createIdentifier(file),
          )
        : name,
    );
  }

  public tag(type: string, arg?: any): ts.TypeReferenceNode {
    const instance: string = this.external({
      type: "instance",
      library: "typia",
      name: "tags",
    });
    return factory.createTypeReferenceNode(
      `${instance}.${type}`,
      arg === undefined ? [] : [TypeLiteralFactory.generate(arg)],
    );
  }

  public toStatements(
    dtoPath: (name: string) => string,
    current?: string,
  ): ts.Statement[] {
    return [
      ...[...this.external_.entries()].map(([library, props]) =>
        factory.createImportDeclaration(
          undefined,
          factory.createImportClause(
            false,
            props.default !== null
              ? factory.createIdentifier(props.default)
              : undefined,
            props.instances.size
              ? factory.createNamedImports(
                  [...props.instances].map((i) =>
                    factory.createImportSpecifier(
                      false,
                      undefined,
                      factory.createIdentifier(i),
                    ),
                  ),
                )
              : undefined,
          ),
          factory.createStringLiteral(library),
        ),
      ),
      ...(this.external_.size && this.dtos_.size
        ? [FilePrinter.newLine()]
        : []),
      ...[...this.dtos_]
        .filter(
          current ? (name) => name !== current!.split(".")[0] : () => true,
        )
        .map((i) =>
          factory.createImportDeclaration(
            undefined,
            // DTO files declare pure types, and generated code references them
            // only in type positions — keep the clause type-only so emitted
            // JS never loads the DTO module at runtime.
            factory.createImportClause(
              true,
              undefined,
              factory.createNamedImports([
                factory.createImportSpecifier(
                  false,
                  undefined,
                  factory.createIdentifier(i),
                ),
              ]),
            ),
            factory.createStringLiteral(dtoPath(i)),
          ),
        ),
    ];
  }
}
export namespace MigrateImportProgrammer {
  export interface IProps {
    type: "default" | "instance";
    library: string;
    name: string;
  }
}
interface IClause {
  default: string | null;
  instances: Set<string>;
}
