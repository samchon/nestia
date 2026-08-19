package test

import (
	"strings"
	"testing"
)

// TestTransformProjectEnvelopeStampsReferenceGraph verifies that the
// project-mode transform envelope carries a `graph` section whose edges record
// the type-only declaration a controller's generated validator was built from,
// and whose `configs` carries the project tsconfig ahead of its `extends`
// ancestry.
//
// A bundler drops type-only imports from its own module graph, so a persistent
// filesystem cache has no edge from a controller module to the DTO whose type
// produced the generated validator, and replays the stale module after that
// type changes. `graph` is the only channel that restores the edge, and the
// import under test — `import { IBbsArticle } from "@api/lib/structures/..."`,
// used solely as a type — is exactly the edge a bundler cannot see. Keying is
// part of the contract too: every envelope section joins by the same
// project-relative key, so an edge recorded under an absolute or OS-separated
// path is unusable even when present.
//
//  1. Run project-mode transform over the body feature with its own cwd.
//  2. Assert the envelope carries a graph and that TypedBodyController's edges
//     list its DTO declaration file under the same key `typescript` uses.
//  3. Assert `configs` starts at the feature tsconfig and reaches the shared
//     base config it extends.
func TestTransformProjectEnvelopeStampsReferenceGraph(t *testing.T) {
	envelope := runProjectTransformEnvelope(t, "body")
	if envelope.Graph == nil {
		t.Fatalf("project-mode envelope carries no graph section")
	}
	const controller = "src/controllers/TypedBodyController.ts"
	const structure = "src/api/structures/IBbsArticle.ts"
	if _, ok := envelope.TypeScript[controller]; !ok {
		t.Fatalf("envelope has no transformed source for %q\n%v", controller, keysOf(envelope.TypeScript))
	}
	mustListContain(t, "graph.edges["+controller+"]", envelope.Graph.Edges[controller], structure)

	if len(envelope.Graph.Configs) == 0 {
		t.Fatalf("graph.configs is empty; a consumer would keep no universal input")
	}
	if envelope.Graph.Configs[0] != "tsconfig.json" {
		t.Fatalf("graph.configs must start at the project tsconfig, got %v", envelope.Graph.Configs)
	}
	extended := false
	for _, config := range envelope.Graph.Configs[1:] {
		if strings.HasSuffix(config, "tests/config/tsconfig.json") {
			extended = true
		}
	}
	if !extended {
		t.Fatalf("graph.configs omits the extended base config\n%v", envelope.Graph.Configs)
	}
}

// keysOf lists a map's keys for a failure message.
func keysOf(source map[string]string) []string {
	keys := make([]string, 0, len(source))
	for key := range source {
		keys = append(keys, key)
	}
	return keys
}
