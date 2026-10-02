import { TsPrinter } from "@ttsc/factory";

import { MetadataSchema, nameOf } from "../../internal/legacy";
import { INestiaProject } from "../../structures/INestiaProject";
import { IReflectType } from "../../structures/IReflectType";
import { ITypedApplication } from "../../structures/ITypedApplication";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedMcpRoute } from "../../structures/ITypedMcpRoute";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";
import { ImportDictionary } from "./ImportDictionary";
import { SdkHttpParameterProgrammer } from "./SdkHttpParameterProgrammer";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";
import { SdkWebSocketCloneProgrammer } from "./SdkWebSocketCloneProgrammer";

/**
 * Rewrites the routes to refer to the cloned DTOs.
 *
 * @evidence contracts/common.md#principled-implementation HTTP and MCP JSON types and their namespace/tag imports are emitted together from resolved metadata by the cloned declaration writer; WebSocket declarations retain their source types and redirect only cloned imports.
 * @evidence contracts/common.md#clear-and-simple-design One public function and three visitors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The routes are rewritten in place, once.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpCloneReferencer composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace SdkHttpCloneReferencer {
  /**
   * Rewrites the HTTP, MCP and WebSocket routes so their types and imports
   * refer to the `structures` files.
   *
   * @evidence contracts/common.md#principled-implementation HTTP and MCP JSON routes use structural TypeNodes and the writer's registered imports. Empty and any/unknown forms retain their baked keyword distinction because they require no cloned component binding; WebSocket source types only redirect imports actually cloned.
   * @evidence contracts/common.md#clear-and-simple-design One loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The routes are edited in place, as the generation owns them.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpCloneReferencer.replace composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const replace = (
    app: ITypedApplication,
    websocket: Set<string> = new Set(),
  ): void => {
    const directory: string = `${app.project.config.output}/structures`;
    for (const route of app.routes)
      if (route.protocol === "http")
        visitHttpRoute({
          project: app.project,
          route,
        });
      else if (route.protocol === "websocket")
        visitWebSocketRoute({
          cloned: websocket,
          directory,
          route,
        });
      else if (route.protocol === "mcp") visitMcpRoute(app.project, route);
  };

  const visitMcpRoute = (
    project: INestiaProject,
    route: ITypedMcpRoute,
  ): void => {
    const importer = new ImportDictionary(
      `${project.config.output}/functional/${route.accessor.join("/")}/index.ts`,
    );
    if (route.input && route.inputMetadata)
      visitType({
        importer,
        project,
        metadata: route.inputMetadata,
        type: route.input.type,
        name: (name) => (route.input!.type = { name }),
      });
    if (route.returnType && route.outputMetadata)
      visitType({
        importer,
        project,
        metadata: route.outputMetadata,
        type: route.returnType,
        name: (name) => (route.returnType = { name }),
      });
    route.imports = importer.toImports();
  };

  const visitHttpRoute = (props: {
    project: INestiaProject;
    route: ITypedHttpRoute;
  }): void => {
    const importer = new ImportDictionary(
      `${props.project.config.output}/functional/${props.route.accessor.join("/")}/index.ts`,
    );
    for (const p of SdkHttpParameterProgrammer.getSignificant(
      props.route,
      true,
    ))
      visitType({
        importer,
        project: props.project,
        metadata: p.metadata,
        type: p.type,
        name: (name) => (p.type = { name }),
      });
    for (const v of Object.values(props.route.exceptions))
      visitType({
        importer,
        project: props.project,
        metadata: v.metadata,
        type: v.type,
        name: (name) => (v.type = { name }),
      });
    if (props.route.success.binary === false)
      visitType({
        importer,
        project: props.project,
        metadata: props.route.success.metadata,
        type: props.route.success.type,
        name: (name) => (props.route.success.type = { name }),
      });
    props.route.imports = importer.toImports();
  };

  const visitWebSocketRoute = (props: {
    cloned: Set<string>;
    directory: string;
    route: ITypedWebSocketRoute;
  }): void => {
    const unique: Map<string, string> = new Map();
    const keep: ITypedWebSocketRoute["imports"] = [];
    for (const imp of props.route.imports) {
      const cloned: string[] = SdkWebSocketCloneProgrammer.isNodeModulesPath(
        imp.file,
      )
        ? []
        : imp.elements.filter((elem) => {
            const imported: string = imp.elementAliases?.[elem] ?? elem;
            return props.cloned.has(
              SdkWebSocketCloneProgrammer.importKey(imp.file, imported),
            );
          });
      const remained: string[] = imp.elements.filter(
        (elem) => cloned.includes(elem) === false,
      );
      for (const elem of cloned)
        unique.set(elem, imp.elementAliases?.[elem] ?? elem);
      if (
        imp.asterisk !== null ||
        imp.default !== null ||
        remained.length !== 0
      )
        keep.push({
          ...imp,
          elements: remained,
        });
    }

    props.route.imports = [
      ...keep,
      ...Array.from(unique).map(([local, imported]) => ({
        file: `${props.directory}/${imported}`,
        asterisk: null,
        default: null,
        elements: [local],
        ...(local === imported
          ? {}
          : { elementAliases: { [local]: imported } }),
      })),
    ];
  };

  const visitType = (p: {
    importer: ImportDictionary;
    project: INestiaProject;
    metadata: MetadataSchema;
    type: IReflectType;
    name: (key: string) => void;
  }): void => {
    // Empty and any/unknown metadata carries no structural declaration from
    // which to recover its source-level keyword distinction. These forms require
    // no cloned component binding; retain the producer's baked name (or declared
    // route type for authored metadata without a bake).
    if (
      p.metadata.any ||
      (p.metadata.nullable === false &&
        p.metadata.escaped === null &&
        p.metadata.rest === null &&
        [
          p.metadata.atomics,
          p.metadata.constants,
          p.metadata.templates,
          p.metadata.arrays,
          p.metadata.tuples,
          p.metadata.objects,
          p.metadata.aliases,
          p.metadata.natives,
          p.metadata.sets,
          p.metadata.maps,
          p.metadata.functions,
        ].every((members) => members.length === 0))
    ) {
      p.name(nameOf(p.metadata) || getFullText(p.type));
      return;
    }
    p.name(
      new TsPrinter().print(
        SdkTypeProgrammer.write(p.project)(p.importer)(p.metadata),
      ),
    );
  };
}

const getFullText = (type: IReflectType): string =>
  type.typeArguments === undefined
    ? type.name
    : `${type.name}<${type.typeArguments.map(getFullText).join(", ")}>`;
