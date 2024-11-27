import { OpenApiV3 } from "@samchon/openapi";
import typia from "typia";

import swagger from "../../../swagger.json";

export const test_openapi_v3 = (): void => {
  typia.assert<OpenApiV3.IDocument>(swagger);
}