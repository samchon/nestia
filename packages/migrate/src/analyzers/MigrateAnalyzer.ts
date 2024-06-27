import { OpenApi } from "@samchon/openapi";

import { IMigrateProgram } from "../structures/IMigrateProgram";

export namespace MigrateAnalyzer {
  export const analyze = (props: IMigrateProgram.IProps): IMigrateProgram => {
    const result = OpenApi.migrate(props.document);
    return {
      ...props,
      routes: result.routes,
      errors: result.errors,
    };
  };
}
