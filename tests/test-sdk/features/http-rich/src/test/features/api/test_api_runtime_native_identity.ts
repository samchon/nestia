import assert from "assert/strict";
import typia from "typia";

/**
 * Verifies structural Blob lookalikes and actual DOM Blobs keep distinct
 * semantics when emitted validators execute in the shared consumer.
 *
 * The Go provenance unit owns the no-DOM user-global versus default-library
 * classification. This consumer can share the existing DOM program by using an
 * explicitly local interface for the structural runtime twin.
 *
 * 1. Emit validators for the authored interface and globalThis.Blob together.
 * 2. Check required-member presence for structural payloads.
 * 3. Reject a structural native lookalike and accept an actual Blob instance.
 *
 * @evidence contracts/testing.md#behavioral-verification The emitted structural predicate accepts customField:string and rejects its absence; the native predicate rejects the same structural value and accepts an actual Blob. Both real typia predicates execute without substituting metadata or helpers.
 * @evidence contracts/testing.md#independent-expectations The local interface independently declares its required string member, while globalThis.Blob explicitly names the runtime-native DOM declaration. Authored payloads and a real Blob constructor establish structural versus identity expectations.
 * @evidence contracts/testing.md#distinguishing-cases Required-member presence and absence contrast the native lookalike and actual-instance controls. The Go TestTransformTypiaRuntimeNativeProvenance separately exercises the exact original no-DOM global in a misleading lib.custom.d.ts file; this case does not claim its local interface reproduces that compiler environment.
 * @evidence contracts/testing.md#execution-ownership The shared SDK DynamicExecutor discovers this matching case and executes its native-emitted typia predicates with the installed runtime. Go source classification executes separately in-process.
 * @evidence contracts/e2e.md#necessary-boundary Executing both specialized predicates detects a broken runtime helper connection or inappropriate instanceof evaluation that source-classification markers cannot establish.
 * @evidence contracts/e2e.md#shared-execution Both predicates belong to the existing shared consumer compiler program. No separate project compilation, application, native host or consumer installation is performed by this case.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The predicates are stateless and every control supplies an authored payload or a fresh Blob; no global declaration, loader, registry or constructor is replaced.
 * @evidence contracts/e2e.md#preserved-coverage All four original native-global runtime decisions survive: structural member acceptance, missing-member rejection, native lookalike rejection and actual Blob acceptance. Exact user-global library provenance is owned by the Go unit rather than being claimed by this shared DOM runtime case.
 */
export const test_api_runtime_native_identity = (): void => {
  interface Blob {
    customField: string;
  }
  const structural = typia.createIs<{ blob: Blob }>();
  const native = typia.createIs<{ blob: globalThis.Blob }>();
  assert.equal(structural({ blob: { customField: "x" } }), true);
  assert.equal(structural({ blob: {} }), false);
  assert.equal(native({ blob: { customField: "x" } }), false);
  assert.equal(native({ blob: new globalThis.Blob([]) }), true);
};
