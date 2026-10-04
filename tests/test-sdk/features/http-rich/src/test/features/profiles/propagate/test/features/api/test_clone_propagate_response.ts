import { IPropagation } from "@nestia/fetcher";
import typia from "typia";

import api from "../../../api";
import { IUser } from "../../../api/structures/IUser";

/**
 * Verifies the generated clone propagation response uses its authored 202 DTO.
 *
 * The original authored inputs and assertions retain their distinct SDK
 * profile.
 *
 * 1. Execute the original assertions through the shared compiled artifacts.
 * 2. Assert the original IUser response through the declared IPropagation 202/404
 *    union.
 *
 * @evidence contracts/testing.md#behavioral-verification Assert the original IUser response through the declared IPropagation 202/404 union.
 * @evidence contracts/testing.md#independent-expectations The authored getUserProfile declaration returns IUser at202 with a404 literal exception; the explicit IPropagation union supplies its accepted shape without using output to create an oracle.
 * @evidence contracts/testing.md#distinguishing-cases This propagate profile retains its original assertions; neighboring profiles preserve their distinct clone/keyword/propagate options, DTO documentation and exception-decorator inputs.
 * @evidence contracts/testing.md#execution-ownership The shared public consumer discovers this matching authored file after one compilation; the case creates no installation, compiler or application.
 * @evidence contracts/e2e.md#necessary-boundary The native compiled fixture and freshly generated installed SDK/Swagger artifacts retain the original assembly or transform connection. Portable option semantics have owning Go units; this case does not launch a host for each rule.
 * @evidence contracts/e2e.md#shared-execution All profiles share one installed graph, producer program, consumer program and HTTP listener. Only public generation and non-listening application input graphs differ where options or authored controller inputs differ.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Unique route/class identities isolate controller variants. Profile-specific output roots isolate generated APIs and documents; stateless requests share one backend and the runner closes every application in finally.
 * @evidence contracts/e2e.md#preserved-coverage Original assertion bodies survive reversible import, accessor, class, file and document-location changes. No random generated profile cases or authored negative/boundary assertions are dropped.
 */
export const test_clone_propagate_response = async (
  connection: api.IConnection,
): Promise<void> => {
  const output: IPropagation<
    {
      202: IUser;
      404: "404 Not Found";
    },
    202
  > = await api.functional.http_rich.clone.propagate.users.user.getUserProfile(
    connection,
    "something",
    {
      user_type: "admin",
    },
  );
  typia.assert(output);
};
