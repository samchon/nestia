import {
  type Expression,
  type Node,
  SyntaxKind,
  type TypeNode,
  factory,
} from "@ttsc/factory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { StringUtil } from "../../utils/StringUtil";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";

/**
 * The parameters of an HTTP route's SDK function.
 *
 * @evidence contracts/common.md#principled-implementation The namespace decides the identifiers, lists the entries, and writes the declarations and the arguments in positional or keyword mode.
 * @evidence contracts/common.md#clear-and-simple-design Several small functions over one entry type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The three consumers share one decision.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace SdkHttpParameterProgrammer {
  /**
   * One parameter of a route: its key, whether it is required, its type, and
   * the reflected parameter.
   *
   * @evidence contracts/common.md#principled-implementation The record is what a declaration or an argument needs.
   * @evidence contracts/common.md#clear-and-simple-design A four-member record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.IEntry composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export interface IEntry {
    key: string;
    required: boolean;
    type: TypeNode;
    parameter: ITypedHttpRouteParameter;
  }

  /**
   * The identifiers one route's SDK function, `path()`, and `simulate()` use,
   * decided once so the three cannot disagree.
   *
   * A user parameter shares those scopes with identifiers the SDK writes: its
   * own `connection` and `props` parameters and locals, and names it cannot
   * change — the route's function and namespace, which are public, and the
   * imports, namespace members, and globals the bodies reference. Nothing kept
   * them apart, so a parameter named like its method or `connection` produced
   * an SDK that does not compile (#1647).
   *
   * The SDK's own identifiers are escaped with `_` prefixes, as it already
   * escaped `output` and `variables`. A user parameter keeps its name, which an
   * IDE shows and which is a `props` key in keyword mode, unless the name is
   * one the SDK cannot change; then the positional parameter alone is renamed,
   * which positional callers never see. The fixed names are only those the
   * generated code actually references for this route and configuration, and an
   * own identifier yields only to the names its scope can see, so nothing is
   * renamed where no name is shadowed.
   *
   * @evidence contracts/common.md#principled-implementation One decision serves the three scopes, so they cannot disagree.
   * @evidence contracts/common.md#clear-and-simple-design A record of names and two lookups.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.INames composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export interface INames {
    connection: string;
    props: string;
    output: string;
    assert: string;
    variables: string;
    location: string;
    key: string;
    value: string;
    elem: string;

    /**
     * Local identifier of a significant parameter in positional mode.
     *
     * @evidence contracts/common.md#principled-implementation A parameter yields to a name the SDK cannot change and keeps its own otherwise.
     * @evidence contracts/common.md#clear-and-simple-design One lookup.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the decision.
     * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.INames.parameter composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
     */
    parameter: (p: ITypedHttpRouteParameter) => string;

    /**
     * Reads a significant parameter: `props.<name>` or its local.
     *
     * @evidence contracts/common.md#principled-implementation The read follows the mode of the function.
     * @evidence contracts/common.md#clear-and-simple-design One lookup.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the decision.
     * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
     * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.INames.access composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
     */
    access: (p: ITypedHttpRouteParameter) => Expression;
  }

  /**
   * Decides the identifiers of a route's function, `path()`, and `simulate()`
   * once.
   *
   * @evidence contracts/common.md#principled-implementation The fixed names each scope references are collected, and every own identifier avoids them and the other own identifiers it can see.
   * @evidence contracts/common.md#clear-and-simple-design One function over the scope sets.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only shadowed names are renamed.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.getNames composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const getNames = (props: {
    project: INestiaProject;
    route: ITypedHttpRoute;
  }): INames => {
    const { project, route } = props;
    const parameters: ITypedHttpRouteParameter[] = getSignificant(route, true);
    const simulate: boolean =
      project.config.simulate === true && parameters.length !== 0;

    // names each scope references and the SDK cannot change
    const functional: string[] = [
      route.name,
      !!route.body?.encrypted || route.success.encrypted
        ? "EncryptedFetcher"
        : "PlainFetcher",
      ...(project.config.assert === true ? ["typia"] : []),
      ...(route.success.setHeaders.some((h) => h.type === "assigner")
        ? ["Object"]
        : []),
    ];
    const path: string[] = [
      ...(route.pathParameters.length !== 0 ? ["PathParameter"] : []),
      ...(route.queryObject !== null || route.queryParameters.length !== 0
        ? ["URLSearchParams", "Object", "Array", "String", "undefined"]
        : []),
    ];
    const simulation: string[] = simulate
      ? ["NestiaSimulator", "METADATA", "path", "random", "typia"]
      : [];

    const locals: Map<ITypedHttpRouteParameter, string> = new Map();
    if (project.config.keyword !== true)
      for (const p of parameters)
        locals.set(
          p,
          StringUtil.escapeDuplicate([
            ...functional,
            ...simulation,
            ...(p.category !== "body" ? path : []),
            ...parameters.filter((q) => q !== p).map((q) => q.name),
            ...locals.values(),
          ])(p.name),
        );
    // An SDK-own identifier avoids the fixed names and the other own ones of
    // its scope, and the positional parameters whose values its scope reads
    // where it is visible: the SDK function's and simulate()'s parameters and
    // locals see every one; in path(), `variables` and `location` see its
    // parameters, the loop's `key` and `value` the query values its header
    // reads, and `elem` none.
    const declared = (list: ITypedHttpRouteParameter[]): string[] =>
      list
        .map((p) => locals.get(p))
        .filter((name): name is string => name !== undefined);
    const queries: ITypedHttpRouteParameter[] = [
      ...route.queryParameters,
      ...(route.queryObject ? [route.queryObject] : []),
    ];
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
    const every: string[] = declared(parameters);
    const shared: string[] = [];
    const $props: string = own(
      [...functional, ...path, ...simulation],
      every,
      shared,
    )("props");
    const $connection: string = own(
      [...functional, ...simulation],
      every,
      shared,
    )("connection");
    const inPath: string[] = [...shared];
    const names: Omit<INames, "parameter" | "access"> = {
      props: $props,
      connection: $connection,
      output: own(functional, every, [...shared])("output"),
      assert: own(simulation, every, [...shared])("assert"),
      variables: own(
        path,
        declared([...route.pathParameters, ...queries]),
        inPath,
      )("variables"),
      location: own(
        path,
        declared([...route.pathParameters, ...queries]),
        inPath,
      )("location"),
      key: own(path, declared(queries), inPath)("key"),
      value: own(path, declared(queries), inPath)("value"),
      elem: own(path, [], inPath)("elem"),
    };
    return {
      ...names,
      parameter: (p) => locals.get(p) ?? p.name,
      access: (p) =>
        project.config.keyword === true
          ? factory.createPropertyAccessExpression(
              factory.createIdentifier(names.props),
              p.name,
            )
          : factory.createIdentifier(locals.get(p) ?? p.name),
    };
  };

  /**
   * Returns every parameter of a route: path, query, header, query object,
   * body, and header object.
   *
   * @evidence contracts/common.md#principled-implementation The list is the concatenation in that order.
   * @evidence contracts/common.md#clear-and-simple-design One list.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It adds no parameter.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.getAll composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const getAll = (
    route: ITypedHttpRoute,
  ): ITypedHttpRouteParameter[] => [
    ...route.pathParameters,
    ...route.queryParameters,
    ...route.headerParameters,
    ...(route.queryObject ? [route.queryObject] : []),
    ...(route.body ? [route.body] : []),
    ...(route.headerObject ? [route.headerObject] : []),
  ];

  /**
   * Returns the parameters that make up a call: path, query, the query object,
   * and the body when asked.
   *
   * @evidence contracts/common.md#principled-implementation Headers travel in the connection and are not arguments.
   * @evidence contracts/common.md#clear-and-simple-design One list.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The body is included by the caller's choice.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.getSignificant composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const getSignificant = (route: ITypedHttpRoute, body: boolean) => [
    ...route.pathParameters,
    ...route.queryParameters,
    ...(route.queryObject ? [route.queryObject] : []),
    ...(body && route.body ? [route.body] : []),
  ];

  /**
   * Returns the entries of a route: path and query parameters, the query
   * object, and the body when asked, with the type each has in the function or
   * in the test.
   *
   * @evidence contracts/common.md#principled-implementation The type is the alias `Query` or `Body` in the function, and the reflected or cloned type in a test.
   * @evidence contracts/common.md#clear-and-simple-design One list of three groups.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty route has no entries.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.getEntries composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const getEntries = (props: {
    project: INestiaProject;
    importer: ImportDictionary;
    route: ITypedHttpRoute;
    body: boolean;
    prefix: boolean | string;
    e2e?: boolean;
  }): IEntry[] => {
    if (
      props.route.pathParameters.length === 0 &&
      props.route.queryParameters.length === 0 &&
      props.route.queryObject === null &&
      (props.body === false || props.route.body === null)
    )
      return [];
    const prefix =
      typeof props.prefix === "string"
        ? props.prefix
        : props.prefix === true
          ? `${props.route.name}.`
          : "";
    return [
      ...[...props.route.pathParameters, ...props.route.queryParameters].map(
        (p) => ({
          key: p.name,
          required: p.metadata.required,
          type:
            props.project.config.clone === true
              ? SdkAliasCollection.from(props.project)(props.importer)(
                  p.metadata,
                )
              : SdkAliasCollection.name(p),
          parameter: p,
        }),
      ),
      ...(props.route.queryObject
        ? [
            {
              key: props.route.queryObject.name,
              required: props.route.queryObject.metadata.required,
              type:
                props.e2e === true
                  ? props.project.config.clone === true
                    ? SdkAliasCollection.from(props.project)(props.importer)(
                        props.route.queryObject.metadata,
                      )
                    : SdkAliasCollection.name(props.route.queryObject)
                  : factory.createTypeReferenceNode(`${prefix}Query`),
              parameter: props.route.queryObject,
            },
          ]
        : []),
      ...(props.body && props.route.body
        ? [
            {
              key: props.route.body.name,
              required: props.route.body.metadata.required,
              type:
                props.e2e === true
                  ? props.project.config.clone === true
                    ? SdkAliasCollection.from(props.project)(props.importer)(
                        props.route.body.metadata,
                      )
                    : SdkAliasCollection.name(props.route.body)
                  : factory.createTypeReferenceNode(`${prefix}Body`),
              parameter: props.route.body,
            },
          ]
        : []),
    ];
  };

  /**
   * Returns the parameter declarations of a route's function: one `props`
   * object in keyword mode, and one positional parameter per entry otherwise.
   *
   * @evidence contracts/common.md#principled-implementation A required parameter cannot follow an optional one, so an optional one before a required one trades its `?` for `undefined` in its type.
   * @evidence contracts/common.md#clear-and-simple-design One function of two modes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The names come from `getNames`.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.getParameterDeclarations composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const getParameterDeclarations = (props: {
    project: INestiaProject;
    importer: ImportDictionary;
    route: ITypedHttpRoute;
    body: boolean;
    prefix: boolean;
  }): Node[] => {
    const entries: IEntry[] = getEntries(props);
    if (entries.length === 0) return [];
    const names: INames = getNames(props);
    if (props.project.config.keyword === true) {
      const typeName: string = props.prefix
        ? `${props.route.name}.Props`
        : "Props";
      const node: TypeNode =
        props.body === false && props.route.body !== null
          ? factory.createTypeReferenceNode("Omit", [
              factory.createTypeReferenceNode(typeName),
              factory.createLiteralTypeNode(
                factory.createStringLiteral(props.route.body.name),
              ),
            ])
          : factory.createTypeReferenceNode(typeName);
      return [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          names.props,
          undefined,
          node,
          undefined,
        ),
      ];
    }
    // a required parameter cannot follow an optional one (TS1016), so an
    // optional parameter before a required one trades its `?` for `undefined`
    // in its type
    return entries.map((e, i) => {
      const trailing: boolean =
        e.required === false &&
        entries.slice(i + 1).every((next) => next.required === false);
      return factory.createParameterDeclaration(
        undefined,
        undefined,
        names.parameter(e.parameter),
        trailing ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
        e.required || trailing ? e.type : undefinable(props.project, e),
        undefined,
      );
    });
  };

  // a cloned field's type admits `undefined` when optional, and a reflected
  // field's does when its name says so (`mode: string | undefined`, not
  // `mode?: string`); the `Query` and `Body` aliases are not inspected
  const undefinable = (project: INestiaProject, e: IEntry): TypeNode =>
    e.parameter.category !== "body" &&
    e.parameter.field !== null &&
    (project.config.clone === true ||
      e.parameter.type.name.split("|").some((t) => t.trim() === "undefined"))
      ? e.type
      : factory.createUnionTypeNode([
          e.type,
          factory.createKeywordTypeNode(SyntaxKind.UndefinedKeyword),
        ]);

  /**
   * Returns the arguments to call a route's function with: the `props` object
   * in keyword mode, and the parameters otherwise.
   *
   * @evidence contracts/common.md#principled-implementation The identifiers are those declared by `getNames`.
   * @evidence contracts/common.md#clear-and-simple-design One function of two modes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No argument is invented for an empty route.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkHttpParameterProgrammer.getArguments composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const getArguments = (props: {
    project: INestiaProject;
    route: ITypedHttpRoute;
    body: boolean;
  }): Node[] => {
    const parameters = getSignificant(props.route, props.body);
    if (parameters.length === 0) return [];
    const names: INames = getNames(props);
    if (props.project.config.keyword === true)
      return [factory.createIdentifier(names.props)];
    return parameters.map((p) => factory.createIdentifier(names.parameter(p)));
  };
}
