package test

import "testing"

// TestTransformProjectEnvelopeReportsConsultedDeclarations verifies the
// project-mode envelope's `dependencies` section lists, for a controller whose
// decorators produced generated validators, the DTO declaration file the
// analysis read to produce them — and lists nothing for a controller that
// consulted no declaration at all.
//
// The section is the transform's own account of its inputs, next to the
// compiler-owned `graph`. A consumer unions the two, so this list is additive
// and an omission costs invalidation breadth rather than correctness. It is
// still the channel a future `dependenciesComplete` declaration would narrow to,
// so a wrong entry here is the seed of a stale output later: a file that lands
// in the list without having been consulted, or a consulted file that never
// arrives, both misdescribe what the generated code was built from.
//
//  1. Run project-mode transform over the body feature with its own cwd.
//  2. Assert TypedBodyController's entry carries the DTO its `@TypedBody` and
//     `@TypedRoute` types resolve to, keyed as `typescript` keys it.
//  3. Assert HealthController — whose route type is a bare literal and whose
//     imports are only `@nestia/core` and `@nestjs/common` — carries no entry.
func TestTransformProjectEnvelopeReportsConsultedDeclarations(t *testing.T) {
	envelope := runProjectTransformEnvelope(t, "body")
	if envelope.Dependencies == nil {
		t.Fatalf("project-mode envelope carries no dependencies section")
	}
	const controller = "src/controllers/TypedBodyController.ts"
	const structure = "src/api/structures/IBbsArticle.ts"
	mustListContain(t, "dependencies["+controller+"]", envelope.Dependencies[controller], structure)

	const health = "src/controllers/HealthController.ts"
	if entries, ok := envelope.Dependencies[health]; ok {
		t.Fatalf("dependencies must not carry %q, got %v", health, entries)
	}
}
