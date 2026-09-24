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

export namespace SdkWebSocketParameterProgrammer {
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

    /** Local identifier of a path parameter in positional mode. */
    parameter: (p: ITypedWebSocketRouteParameter.IParam) => string;

    /** Reads a parameter, or one of `query` and `provider`, by its key. */
    access: (key: string) => Expression;
  }

  export const getNames = (props: {
    project: INestiaProject;
    route: ITypedWebSocketRoute;
  }): INames => {
    const { project, route } = props;
    // names each scope references and the SDK cannot change
    const functional: string[] = [route.name, "WebSocketConnector"];
    const path: string[] = [
      ...(route.pathParameters.length !== 0 ? ["encodeURIComponent"] : []),
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

  export const isPathEmpty = (route: ITypedWebSocketRoute): boolean =>
    route.pathParameters.length === 0 && route.query === null;
}
