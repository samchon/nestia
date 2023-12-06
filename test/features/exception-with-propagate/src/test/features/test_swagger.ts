import { TestValidator } from "@nestia/e2e";

import { ErrorCode } from "../../structures/ErrorCode";

export const test_swagger = async () => {
  const content = await import("../../../swagger.json");
  const test = (
    path:
      | "/success"
      | "/success/{error_type}"
      | "/fail/{error_type}"
      | "/fail/composite/{error_type}",
    expected: string[],
  ) => {
    const actual =
      content["paths"][path]["get"]["responses"]["401"]["content"][
        "application/json"
      ]["schema"]["enum"];
    return TestValidator.equals(path)(expected.sort())(actual.sort());
  };
  const required: ErrorCode.Permission.Required = "REQUIRED_PERMISSION";
  const expired: ErrorCode.Permission.Expired = "EXPIRED_PERMISSION";
  const invalid: ErrorCode.Permission.Invalid = "INVALID_PERMISSION";
  test("/success", [invalid]);
  test("/success/{error_type}", [expired, required]);
  test("/fail/{error_type}", [expired, invalid]);
  test("/fail/composite/{error_type}", [expired, invalid, required]);
};
