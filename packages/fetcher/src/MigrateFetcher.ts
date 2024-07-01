import { IMigrateRoute } from "@samchon/openapi";

import { IConnection } from "./IConnection";
import { PlainFetcher } from "./PlainFetcher";

export namespace MigrateFetcher {
  export interface IProps {
    route: IMigrateRoute;
    connection: IConnection;
    arguments: any[];
  }

  export async function request(props: IProps): Promise<any> {
    const length: number =
      props.route.parameters.length +
      (props.route.query ? 1 : 0) +
      (props.route.body ? 1 : 0);
    if (props.arguments.length !== length)
      throw new Error(
        `Error on MigrateFetcher.request(): arguments length is not matched with the route (expected: ${length}, actual: ${props.arguments.length}).`,
      );
    else if (
      props.route.body?.["x-nestia-encrypted"] === true ||
      props.route.success?.["x-nestia-encrypted"] === true
    )
      throw new Error(
        `Error on MigrateFetcher.request(): encrypted API is not supported yet.`,
      );
    return PlainFetcher.fetch(
      props.connection,
      {
        method: props.route.method.toUpperCase() as "POST",
        path: getPath(props),
        template: props.route.path,
        status: null,
        request: props.route.body
          ? {
              encrypted: false,
              type: props.route.body.type,
            }
          : null,
        response: {
          encrypted: false,
          type: props.route.success?.type ?? "application/json",
        },
      },
      props.route.body ? props.arguments.at(-1) : undefined,
    );
  }

  function getPath(props: Pick<IProps, "arguments" | "route">): string {
    let path: string = props.route.emendedPath;
    props.route.parameters.forEach((p, i) => {
      path = path.replace(`:${p.key}`, props.arguments[i]);
    });
    if (props.route.query)
      path += getQueryPath(props.arguments[props.route.parameters.length]);
    return path;
  }

  function getQueryPath(query: Record<string, any>): string {
    const variables = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (undefined === value) continue;
      else if (Array.isArray(value))
        value.forEach((elem: any) => variables.append(key, String(elem)));
      else variables.set(key, String(value));
    return 0 === variables.size ? "" : `?${variables.toString()}`;
  }
}
