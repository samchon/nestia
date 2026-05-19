import { TypeScriptFactory } from "@nestia/factory";
import ts from "../internal/ts";

import { TypeLiteralFactory } from "../factories/TypeLiteralFactory";
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
    return TypeScriptFactory.createTypeReferenceNode(
      namespace?.length
        ? TypeScriptFactory.createQualifiedName(
            TypeScriptFactory.createIdentifier(namespace),
            TypeScriptFactory.createIdentifier(file),
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
    return TypeScriptFactory.createTypeReferenceNode(
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
        TypeScriptFactory.createImportDeclaration(
          undefined,
          TypeScriptFactory.createImportClause(
            false,
            props.default !== null
              ? TypeScriptFactory.createIdentifier(props.default)
              : undefined,
            props.instances.size
              ? TypeScriptFactory.createNamedImports(
                  [...props.instances].map((i) =>
                    TypeScriptFactory.createImportSpecifier(
                      false,
                      undefined,
                      TypeScriptFactory.createIdentifier(i),
                    ),
                  ),
                )
              : undefined,
          ),
          TypeScriptFactory.createStringLiteral(library),
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
          TypeScriptFactory.createImportDeclaration(
            undefined,
            TypeScriptFactory.createImportClause(
              false,
              undefined,
              TypeScriptFactory.createNamedImports([
                TypeScriptFactory.createImportSpecifier(
                  false,
                  undefined,
                  TypeScriptFactory.createIdentifier(i),
                ),
              ]),
            ),
            TypeScriptFactory.createStringLiteral(dtoPath(i)),
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
