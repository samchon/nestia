import { OpenApiV3 } from "@typia/interface";
import typia from "typia";

import swagger from "../../../swagger.json";

export const test_openapi_v3 = (): void => {
  typia.assert<OpenApiV3.IDocument>(swagger);
};
