package test

import "testing"

// TestTransformProjectEnvelopeGraphOmitsAnUnreferencedDeclaration verifies the
// reference graph reports one controller's own resolved references rather than
// the project's file list: a controller that imports no DTO gets no edge to
// another controller's DTO, and no compiler-bundled library file reaches any
// section.
//
// This is the negative twin of the stamping test, and the failure it guards is
// silent in the positive direction. A graph that widened every file's edge set —
// by keying the whole program under each file, or by falling back to "every
// source" — would still pass "the DTO edge is present" while destroying the
// point of the section: the consumer would invalidate every module on any type
// edit, which is the whole-snapshot revalidation the graph exists to replace.
// Bundled `lib.*.d.ts` files change only with the toolchain, so a consumer that
// registered them as filesystem inputs would watch paths that do not exist.
//
//  1. Run project-mode transform over the body feature with its own cwd.
//  2. Assert HealthController — which imports only @nestia/core and
//     @nestjs/common — carries no edge to the DTO TypedBodyController consults.
//  3. Assert no edge key, edge target, global, or config uses the virtual
//     `bundled:///` scheme.
func TestTransformProjectEnvelopeGraphOmitsAnUnreferencedDeclaration(t *testing.T) {
	envelope := runProjectTransformEnvelope(t, "body")
	if envelope.Graph == nil {
		t.Fatalf("project-mode envelope carries no graph section")
	}
	const health = "src/controllers/HealthController.ts"
	const structure = "src/api/structures/IBbsArticle.ts"
	if _, ok := envelope.TypeScript[health]; !ok {
		t.Fatalf("envelope has no transformed source for %q", health)
	}
	mustListOmit(t, "graph.edges["+health+"]", envelope.Graph.Edges[health], structure)

	for key, targets := range envelope.Graph.Edges {
		mustOmitBundledScheme(t, "graph.edges key", []string{key})
		mustOmitBundledScheme(t, "graph.edges["+key+"]", targets)
	}
	mustOmitBundledScheme(t, "graph.globals", envelope.Graph.Globals)
	mustOmitBundledScheme(t, "graph.configs", envelope.Graph.Configs)
}
