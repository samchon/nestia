import api from "@api";

import { validate_exception_filter } from "../../internal/validate_exception_filter";

export const test_api_exception_internal = validate_exception_filter(500)(
  (connection) => api.functional.exception.internal(connection),
);
