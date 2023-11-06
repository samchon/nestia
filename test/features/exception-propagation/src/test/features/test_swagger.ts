import { TestValidator } from "@nestia/e2e";

import { ErrorCode } from "../../structures/ErrorCode";

export const test_swagger = async () => {
    const test = async (
        path:
            | "/a-success-case"
            | "/a-success-case/union"
            | "/b-fail-case"
            | "/b-fail-case/composite",
        expected: string[],
    ) => {
        path;
        const content = await import("../../../swagger.json");
        const actual: string[] = (content["paths"][path] as any)["get"][
            "responses"
        ]["401"]["content"]["application/json"]["schema"]["enum"];
        TestValidator.equals(path)(expected.sort())(actual.sort());
    };
    const required: ErrorCode.Permission.Required = "REQUIRED_PERMISSION";
    const expired: ErrorCode.Permission.Expired = "EXPIRED_PERMISSION";
    const invalid: ErrorCode.Permission.Invalid = "INVALID_PERMISSION";
    test("/a-success-case", [invalid]);
    test("/a-success-case/union", [expired, required]);
    test("/b-fail-case", [expired, invalid]);
    test("/b-fail-case/composite", [expired, invalid, required]);
};
