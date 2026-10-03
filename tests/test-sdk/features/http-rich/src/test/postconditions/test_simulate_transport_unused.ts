import { TestValidator } from "@nestia/e2e";

/**
 * Verifies generated simulators never enter their real transport boundary.
 *
 * Invalid inputs can receive 400 from a real server too. The original handler
 * state and actual request count distinguish simulator validation from an
 * accidental HTTP fallback, after all positive and negative calls settle.
 *
 * 1. Execute every generated simulator call and five authored invalid calls.
 * 2. Read the actual producer's retained handler state and middleware count.
 * 3. Require untouched handler state and zero requests, without resetting either.
 *
 * @evidence contracts/testing.md#behavioral-verification The actual producer state must remain false and the middleware's simulation route count must remain zero after all calls, exposing both handler entry and validation-only HTTP fallback.
 * @evidence contracts/testing.md#independent-expectations False and zero follow from the public simulate connection contract and the original fixture's untouched Global.used requirement, not generated output.
 * @evidence contracts/testing.md#distinguishing-cases Generated valid simulator calls and five one-field invalid body/query/string/date/UUID calls share this final guard. Any handler entry or HTTP request makes the guard fail.
 * @evidence contracts/testing.md#execution-ownership The runner discovers this matching postcondition once after feature executions and aggregates failures before closing the actual shared listener.
 * @evidence contracts/e2e.md#necessary-boundary The installed generated SDK simulator must avoid the real compiled backend, including failed validation before controller entry. An isolated DTO or composer unit cannot establish this boundary.
 * @evidence contracts/e2e.md#shared-execution All simulator cases reuse the installed graph, shared producer and consumer and real listener. This final read starts no additional compiler, application or request.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The runner supplies the same cached producer namespace used by its controllers and a dedicated route-prefix request counter. No reset hides activity and the guard runs after every feature settles.
 * @evidence contracts/e2e.md#preserved-coverage The original Global.used false guard survives against the actual producer rather than an independent consumer copy; the additional zero-request assertion covers invalid calls rejected before handler execution.
 */
export const test_simulate_transport_unused = async (
  state: { used: boolean },
  requests: number,
): Promise<void> => {
  TestValidator.equals("real handlers unused", state.used, false);
  TestValidator.equals("real transport unused", requests, 0);
};
