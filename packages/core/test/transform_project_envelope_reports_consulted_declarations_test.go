package test

import (
	"strings"
	"testing"
)

// TestTransformProjectEnvelopeReportsConsultedDeclarations verifies the
// project-mode envelope's `dependencies` section lists, for a controller whose
// decorators produced generated validators, the DTO declaration file the
// analysis read to produce them; lists only callee declarations for a
// controller whose routes validate nothing; and lists nothing for a file that
// makes no call at all.
//
// The section is the transform's own account of its inputs, next to the
// compiler-owned `graph`. A consumer unions the two, so this list is additive
// and an omission costs invalidation breadth rather than correctness. It is
// still the channel a future `dependenciesComplete` declaration would narrow to,
// so a wrong entry here is the seed of a stale output later: a file that lands
// in the list without having been consulted, or a consulted file that never
// arrives, both misdescribe what the generated code was built from.
//
// Since typia 15, the analysis also reports the files that decide which
// declaration each call it examines resolves to, typia's or not, because
// re-pointing one of them can turn a plain call into a generated validator. A
// decorator is such a call, so a controller consults its decorators'
// declarations even when no route validates anything.
//
//  1. Run project-mode transform over the body feature with its own cwd.
//  2. Assert TypedBodyController's entry carries the DTO its `@TypedBody` and
//     `@TypedRoute` types resolve to, keyed as `typescript` keys it.
//  3. Assert HealthController, whose route type is a bare literal, carries the
//     declaration its `@Controller` decorator call resolves to and not the DTO.
//  4. Assert the DTO's own file, which declares types and makes no call,
//     carries no entry.
func TestTransformProjectEnvelopeReportsConsultedDeclarations(t *testing.T) {
	envelope := runProjectTransformEnvelope(t, "body")
	if envelope.Dependencies == nil {
		t.Fatalf("project-mode envelope carries no dependencies section")
	}
	const controller = "src/controllers/TypedBodyController.ts"
	const structure = "src/api/structures/IBbsArticle.ts"
	mustListContain(t, "dependencies["+controller+"]", envelope.Dependencies[controller], structure)

	const health = "src/controllers/HealthController.ts"
	const decorator = "/@nestjs/common/decorators/core/controller.decorator.d.ts"
	entries := envelope.Dependencies[health]
	found := false
	for _, entry := range entries {
		found = found || strings.HasSuffix(entry, decorator)
	}
	if found == false {
		t.Fatalf("dependencies[%s] does not carry the @Controller declaration\n%v", health, entries)
	}
	mustListOmit(t, "dependencies["+health+"]", entries, structure)

	if _, ok := envelope.TypeScript[structure]; ok == false {
		t.Fatalf("%q is not a transformed file, so its absence proves nothing\n%v", structure, keysOf(envelope.TypeScript))
	}
	if entries, ok := envelope.Dependencies[structure]; ok {
		t.Fatalf("dependencies must not carry %q, got %v", structure, entries)
	}
}
