import { HttpMigration, IHttpMigrateApplication } from "@samchon/openapi";

import { IHttpMigrateProgram } from "../structures/IHttpMigrateProgram";

export namespace MigrateAnalyzer {
  export const analyze = (
    props: IHttpMigrateProgram.IProps,
  ): IHttpMigrateProgram => {
    const application: IHttpMigrateApplication = HttpMigration.application(
      props.document,
    );
    return {
      ...props,
      routes: application.routes,
      errors: application.errors,
    };
  };
}
