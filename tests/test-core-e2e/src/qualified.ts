import typia from "typia";

export namespace A {
  export namespace B {
    export namespace C {
      export type Kind = "x" | "y" | "z";
    }
  }
}

export const KINDS = typia.misc.literals<A.B.C.Kind>();
export const ASSERT = typia.createAssert<A.B.C.Kind>();
export const JSON_STR = typia.json.createStringify<A.B.C.Kind>();
