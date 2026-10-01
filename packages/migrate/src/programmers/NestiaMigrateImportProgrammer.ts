import { SyntaxKind, factory } from "@ttsc/factory";

import { TypeLiteralFactory } from "../factories/TypeLiteralFactory";
import ts from "../internal/ts";
import { FilePrinter } from "../utils/FilePrinter";
import { MapUtil } from "../utils/MapUtil";

/**
 * Collects the imports that generated code needs and turns them into import
 * statements.
 *
 * @evidence contracts/common.md#principled-implementation External imports are grouped by library into one clause with an optional default and a set of named instances, DTO imports are grouped by module specifier and emitted type-only, and a DTO is never imported into its own file.
 * @evidence contracts/common.md#clear-and-simple-design One class with two collections and one emitter; the tag helper builds `typia.tags` references.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The imports follow the code that asks for them.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export class NestiaMigrateImportProgrammer {
  private external_: Map<string, IClause> = new Map();
  private dtos_: Set<string> = new Set();

  public constructor() {}

  /**
   * Reports whether no import has been requested.
   *
   * @evidence contracts/common.md#principled-implementation The importer is empty exactly when both collections are empty.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the state.
   * @evidence contracts/common.md#meaningful-documentation The comment states the meaning.
   */
  public empty(): boolean {
    return this.external_.size === 0 && this.dtos_.size === 0;
  }

  /**
   * Requests an import from a library and returns the local name to use.
   *
   * The returned name is the first segment of the requested name, so a nested
   * name such as `tags.Type` imports `tags`.
   *
   * @evidence contracts/common.md#principled-implementation A default import replaces the clause's default and an instance import adds a named import, and the first segment of a dotted name is what the code refers to.
   * @evidence contracts/common.md#clear-and-simple-design One function over one map.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The library and the name come from the caller.
   * @evidence contracts/common.md#meaningful-documentation The comment states the returned name.
   */
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

  /**
   * Requests a DTO import and returns a reference to it, qualified by a
   * namespace when one is given.
   *
   * @evidence contracts/common.md#principled-implementation The DTO is recorded by the first segment of its dotted name, which is the file that exports it, and the returned reference keeps the full name.
   * @evidence contracts/common.md#clear-and-simple-design One function over one set.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The name comes from the caller.
   * @evidence contracts/common.md#meaningful-documentation The comment states the reference.
   */
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

  /**
   * Requests the `typia` tags import and returns a reference to a tag with an
   * optional literal argument.
   *
   * @evidence contracts/common.md#principled-implementation The argument is converted to a literal type, so `Minimum<3>` is written as a type reference with the literal.
   * @evidence contracts/common.md#clear-and-simple-design One function delegating the literal building.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The tag name and the argument come from the caller.
   * @evidence contracts/common.md#meaningful-documentation The comment states the reference.
   */
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

  /**
   * Returns the import statements: the external imports, a blank line when both
   * kinds exist, and the type-only DTO imports.
   *
   * @evidence contracts/common.md#principled-implementation DTO names are grouped by the specifier that `dtoPath` returns, a name equal to the current file is skipped so a file never imports itself, and package specifiers merge into one clause.
   * @evidence contracts/common.md#clear-and-simple-design One function with two emit sections.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The specifier rule is the caller's.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result and the self-import rule.
   */
  public toStatements(
    dtoPath: (name: string) => string,
    current?: string,
  ): ts.Statement[] {
    // Group the DTO references by their resolved module specifier: relative
    // specifiers stay one-import-per-file, while package specifiers (e.g. the
    // monorepo's `@ORGANIZATION/PROJECT-api`) merge into a single clause.
    const modules: Map<string, string[]> = new Map();
    for (const name of this.dtos_)
      if (current === undefined || name !== current.split(".")[0])
        MapUtil.take(modules)(dtoPath(name))(() => []).push(name);
    return [
      ...[...this.external_.entries()].map(([library, props]) =>
        factory.createImportDeclaration(
          undefined,
          factory.createImportClause(
            undefined,
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
      ...[...modules.entries()].map(([specifier, names]) =>
        factory.createImportDeclaration(
          undefined,
          // DTO files declare pure types, and generated code references them
          // only in type positions — keep the clause type-only so emitted
          // JS never loads the DTO module at runtime.
          factory.createImportClause(
            SyntaxKind.TypeKeyword,
            undefined,
            factory.createNamedImports(
              names.map((name) =>
                factory.createImportSpecifier(
                  false,
                  undefined,
                  factory.createIdentifier(name),
                ),
              ),
            ),
          ),
          factory.createStringLiteral(specifier),
        ),
      ),
    ];
  }
}
/**
 * Types of the importer: the properties of an external import request.
 *
 * @evidence contracts/common.md#principled-implementation The record names the import kind, the library, and the name.
 * @evidence contracts/common.md#clear-and-simple-design One namespace with one interface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It contains types only.
 * @evidence contracts/common.md#meaningful-documentation The comment names its content.
 */
export namespace MigrateImportProgrammer {
  /**
   * An external import request: `default` or `instance`, the library, and the
   * name.
   *
   * @evidence contracts/common.md#principled-implementation The kind selects between the default clause and a named import.
   * @evidence contracts/common.md#clear-and-simple-design A three-field record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states each field.
   */
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
