import {
  type Expression,
  type ParameterDeclaration,
  type TypeNode,
  factory,
} from "@ttsc/factory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";
import { ITypedWebSocketRouteParameter } from "../../structures/ITypedWebSocketRouteParameter";
import { StringUtil } from "../../utils/StringUtil";
import { SdkAliasCollection } from "./SdkAliasCollection";

/**
 * The parameters of a WebSocket route's SDK function.
 *
 * @evidence contracts/common.md#principled-implementation The namespace decides the identifiers, lists the entries, and writes the declarations, as the HTTP one does.
 * @evidence contracts/common.md#clear-and-simple-design Several small functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The identifiers are decided once.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkWebSocketParameterProgrammer composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace SdkWebSocketParameterProgrammer {
  /**
   * One parameter of a WebSocket route: its key and its type.
   *
   * @evidence contracts/common.md#principled-implementation The record is what a declaration needs.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkWebSocketParameterProgrammer.IEntry composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export interface IEntry {
    key: string;
    type: TypeNode;
  }

  /**
   * The identifiers one WebSocket route's SDK function and `path()` use,
   * decided once so the two cannot disagree; the HTTP counterpart,
   * `SdkHttpParameterProgrammer.INames`, gives the rules.
   *
   * Path parameters are the user's names. `query` and `provider` are the SDK's
   * own: the positional parameters, or the `props` keys in keyword mode, that
   * carry the query object and the provider, so they yield to a path parameter
   * of the same name instead of repeating it. A `props` key shadows nothing, so
   * it yields to nothing else.
   *
   * @evidence contracts/common.md#principled-implementation One decision serves the two scopes.
   * @evidence contracts/common.md#clear-and-simple-design A record of names and two lookups.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkWebSocketParameterProgrammer.INames composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export interface INames {
    connection: string;
    props: string;
    query: string;
    provider: string;
    url: string;
    connector: string;
    driver: string;
    variables: string;
    location: string;
    key: string;
    value: string;
    elem: string;

    /**
     * Local identifier of a path parameter in positional mode.
     *
     * @evidence contracts/common.md#principled-implementation A path parameter keeps its name unless the SDK cannot change the name it collides with.
     * @evidence contracts/common.md#clear-and-simple-design One lookup.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the decision.
     * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkWebSocketParameterProgrammer.INames.parameter composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
     */
    parameter: (p: ITypedWebSocketRouteParameter.IParam) => string;

    /**
     * Reads a parameter, or one of `query` and `provider`, by its key.
     *
     * @evidence contracts/common.md#principled-implementation The read follows the mode of the function.
     * @evidence contracts/common.md#clear-and-simple-design One lookup.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the decision.
     * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkWebSocketParameterProgrammer.INames.access composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
     */
    access: (key: string) => Expression;
  }

  /**
   * Decides the identifiers of a WebSocket route's function and `path()` once.
   *
   * @evidence contracts/common.md#principled-implementation The fixed names each scope references are collected, and `query` and `provider` yield to a path parameter of the same name.
   * @evidence contracts/common.md#clear-and-simple-design One function over the scope sets.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only shadowed names are renamed.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkWebSocketParameterProgrammer.getNames composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const getNames = (props: {
    project: INestiaProject;
    route: ITypedWebSocketRoute;
  }): INames => {
    const { project, route } = props;
    // names each scope references and the SDK cannot change
    const functional: string[] = [route.name, "WebSocketConnector"];
    const path: string[] = [
      ...(route.pathParameters.length !== 0 ? ["PathParameter"] : []),
      ...(route.query !== null
        ? ["URLSearchParams", "Object", "Array", "String", "undefined"]
        : []),
    ];
    const locals: Map<ITypedWebSocketRouteParameter.IParam, string> = new Map();
    if (project.config.keyword !== true)
      for (const p of route.pathParameters)
        locals.set(
          p,
          StringUtil.escapeDuplicate([
            ...functional,
            ...path,
            ...route.pathParameters.filter((q) => q !== p).map((q) => q.name),
            ...locals.values(),
          ])(p.name),
        );
    // `query` and `provider` sit beside the path parameters, as parameters or
    // as `props` keys. Every other own identifier avoids the positional
    // path parameters its scope reads where it is visible: all of them for
    // the function's locals, `variables`, and `location`, none for the
    // loop's `key` and `value`, whose header reads only the query, and for
    // `elem`.
    const keys: string[] = route.pathParameters.map(
      (p) => locals.get(p) ?? p.name,
    );
    const positional: string[] = [...locals.values()];
    const own =
      (fixed: string[], reads: string[], taken: string[]) =>
      (name: string): string => {
        const escaped: string = StringUtil.escapeDuplicate([
          ...fixed,
          ...reads,
          ...taken,
        ])(name);
        taken.push(escaped);
        return escaped;
      };
    const shared: string[] = [];
    const $props: string = own([...functional, ...path], [], shared)("props");
    // Positional `query` and `provider` also yield to the names their scopes
    // reference; as `props` keys they shadow nothing, so a route named
    // `query` keeps its `query` key.
    const beside = (fixed: string[]) =>
      own(project.config.keyword === true ? [] : fixed, keys, shared);
    const $query: string = beside([...functional, ...path])("query");
    const $provider: string = beside(functional)("provider");
    const inFunction: string[] = [...shared];
    const inPath: string[] = [...shared];
    const names: Omit<INames, "parameter" | "access"> = {
      props: $props,
      query: $query,
      provider: $provider,
      connection: own(functional, positional, inFunction)("connection"),
      url: own(functional, positional, inFunction)("url"),
      connector: own(functional, positional, inFunction)("connector"),
      driver: own(functional, positional, inFunction)("driver"),
      variables: own(path, positional, inPath)("variables"),
      location: own(path, positional, inPath)("location"),
      key: own(path, [], inPath)("key"),
      value: own(path, [], inPath)("value"),
      elem: own(path, [], inPath)("elem"),
    };
    return {
      ...names,
      parameter: (p) => locals.get(p) ?? p.name,
      access: (key) =>
        project.config.keyword === true
          ? factory.createPropertyAccessExpression(
              factory.createIdentifier(names.props),
              key,
            )
          : factory.createIdentifier(key),
    };
  };

  /**
   * Returns the entries of a WebSocket route: its path parameters, its query,
   * and its provider.
   *
   * @evidence contracts/common.md#principled-implementation The query exists only when the route has one, and the provider is included only when the caller requests it.
   * @evidence contracts/common.md#clear-and-simple-design One list.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The order is the call order.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkWebSocketParameterProgrammer.getEntries composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const getEntries = (props: {
    project: INestiaProject;
    route: ITypedWebSocketRoute;
    provider: boolean;
    prefix: boolean;
  }): IEntry[] => {
    const names: INames = getNames(props);
    const prefix: string = props.prefix ? `${props.route.name}.` : "";
    return [
      ...props.route.pathParameters.map((p) => ({
        key: names.parameter(p),
        type: SdkAliasCollection.name(p),
      })),
      ...(props.route.query
        ? [
            {
              key: names.query,
              type: factory.createTypeReferenceNode(`${prefix}Query`),
            },
          ]
        : []),
      ...(props.provider
        ? [
            {
              key: names.provider,
              type: factory.createTypeReferenceNode(`${prefix}Provider`),
            },
          ]
        : []),
    ];
  };

  /**
   * Returns the parameter declarations of a WebSocket route's function: `props`
   * in keyword mode, and one positional parameter per entry otherwise.
   *
   * @evidence contracts/common.md#principled-implementation The names come from `getNames`.
   * @evidence contracts/common.md#clear-and-simple-design One function of two modes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The two modes share the entries.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkWebSocketParameterProgrammer.getParameterDeclarations composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const getParameterDeclarations = (props: {
    project: INestiaProject;
    route: ITypedWebSocketRoute;
    provider: boolean;
    prefix: boolean;
  }): ParameterDeclaration[] => {
    const entries: IEntry[] = getEntries(props);
    if (entries.length === 0) return [];
    else if (props.project.config.keyword === true) {
      const names: INames = getNames(props);
      const typeName: string = props.prefix
        ? `${props.route.name}.Props`
        : "Props";
      const node: TypeNode = props.provider
        ? factory.createTypeReferenceNode(typeName)
        : factory.createTypeReferenceNode("Omit", [
            factory.createTypeReferenceNode(typeName),
            factory.createLiteralTypeNode(
              factory.createStringLiteral(names.provider),
            ),
          ]);
      return [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          names.props,
          undefined,
          node,
        ),
      ];
    }
    return entries.map((entry) =>
      factory.createParameterDeclaration(
        undefined,
        undefined,
        entry.key,
        undefined,
        entry.type,
      ),
    );
  };

  /**
   * Reports whether the route's path holds no parameter, so `path()` takes
   * none.
   *
   * @evidence contracts/common.md#principled-implementation The route has no path parameter and no query.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the route.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkWebSocketParameterProgrammer.isPathEmpty composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const isPathEmpty = (route: ITypedWebSocketRoute): boolean =>
    route.pathParameters.length === 0 && route.query === null;
}
