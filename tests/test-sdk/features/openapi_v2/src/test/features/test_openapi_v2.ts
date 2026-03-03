import { SwaggerV2 } from "@samchon/openapi";
import typia from "typia";

import swagger from "../../../swagger.json";

export const test_openapi_v2 = (): void => {
  typia.assert<SwaggerV2.IDocument>(swagger);
};
