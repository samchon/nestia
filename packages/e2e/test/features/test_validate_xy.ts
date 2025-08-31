import { TestValidator } from "@nestia/e2e";

export const test_validate_xy = (): void => {
  interface IExplicit {
    id: string;
    name: string;
  }
  TestValidator.equals("xy", { id: "1" }, {
    id: "1",
    name: "John Doe",
  } satisfies IExplicit as IExplicit);
  TestValidator.notEquals("xy", { id: "1" }, {
    id: "2",
    name: "Kevin",
  } satisfies IExplicit as IExplicit);
};
