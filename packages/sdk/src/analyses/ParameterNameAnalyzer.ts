import { NamingConvention } from "@typia/utils";

import { StringUtil } from "../utils/StringUtil";

export namespace ParameterNameAnalyzer {
  export interface IParameter {
    name: string;
    category: string;
    field?: string | null;
  }

  /**
   * Names every parameter that declares no name of its own.
   *
   * A destructured parameter, `@TypedBody() { title }: IBody`, binds names but
   * is not one, so the SDK's metadata carries it with an empty name. Its source
   * text is no identifier the SDK could declare, and passing it as one would
   * send `{ title }` alone. It is named after what it carries instead: its
   * field when that is an identifier, or reads as one with its separators
   * dropped in camel case, otherwise its category, such as `body` or `query`.
   * The name yields to every other parameter's, which are the user's and are
   * kept.
   */
  export const name = <T extends IParameter>(parameters: T[]): T[] => {
    const taken: string[] = parameters
      .map((p) => p.name)
      .filter((name) => name.length !== 0);
    return parameters.map((p) => {
      if (p.name.length !== 0) return p;
      const name: string = StringUtil.escapeDuplicate(taken)(candidate(p));
      taken.push(name);
      return { ...p, name };
    });
  };

  const candidate = (p: IParameter): string => {
    if (p.field !== undefined && p.field !== null && p.field.length !== 0) {
      if (NamingConvention.variable(p.field)) return p.field;
      // `x-tenant` as `xTenant`
      const camel: string = p.field
        .split(/[^A-Za-z0-9_$]+/)
        .filter((word) => word.length !== 0)
        .map((word, i) =>
          i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join("");
      if (NamingConvention.variable(camel)) return camel;
    }
    return p.category;
  };
}
