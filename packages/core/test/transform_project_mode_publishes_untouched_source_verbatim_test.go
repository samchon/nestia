package test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// TestTransformProjectModePublishesUntouchedSourceVerbatim verifies the
// project envelope publishes a file no transform changed as its authored text,
// and a changed file with a source map back to its authored text.
//
// `@ttsc/unplugin` keeps a module only when the published text equals the text
// it read. A printed copy of an unchanged file differs from it in formatting,
// so a bundler took every module as transformed and served lines that no
// longer matched the file; under Bun, which ignores the map an `onLoad`
// returns, breakpoints broke in every module of a nestia project
// (samchon/nestia#1809).
//
//  1. Run project-mode transform over the body fixture.
//  2. Assert its two declaration-only structures are published byte for byte
//     as they are on disk, with no source map entry.
//  3. Assert the rewritten TypedBody controller carries a version 3 map whose
//     `sourcesContent` is its file on disk.
//  4. Run single-file mode on one structure and assert it prints the file as
//     written.
//
// @evidence contracts/testing.md#behavioral-verification The decoded envelope publishes ISystem.ts and IBbsArticle.ts byte for byte without a map entry, the rewritten TypedBodyController.ts carries a version 3 map naming it, and single-file mode prints ISystem.ts as written.
// @evidence contracts/testing.md#independent-expectations The fixture files read from disk are the oracle for the unchanged structures and for the controller map's sourcesContent; the controller is known to be rewritten from its injected validator, not from output this host printed.
// @evidence contracts/testing.md#distinguishing-cases A rewritten controller is paired with untouched structures whose two-space indentation and comments the printer would rewrite, so a reprint fails the verbatim comparison and a missing or misattached map fails the controller checks.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against authored fixture source. The single-file output belongs to t.TempDir; no consumer installation or native host process is started.
func TestTransformProjectModePublishesUntouchedSourceVerbatim(t *testing.T) {
	root := featureRootForCore(t, "body")
	envelope := runProjectTransformEnvelope(t, "body")

	for _, source := range []string{
		"src/api/structures/ISystem.ts",
		"src/api/structures/IBbsArticle.ts",
	} {
		authored := mustReadFile(t, filepath.Join(root, source))
		if text, ok := envelope.TypeScript[source]; !ok || text != authored {
			t.Fatalf("%s has no nestia or typia call and must be published as written:\nwant %q\ngot  %q", source, authored, text)
		}
		if _, ok := envelope.SourceMaps[source]; ok {
			t.Fatalf("%s is published as written and must carry no source map", source)
		}
	}

	controller := "src/controllers/TypedBodyController.ts"
	mustDecorateAll(t, envelope.TypeScript[controller], `@core\.TypedBody`, "validate")
	sourceMap, ok := envelope.SourceMaps[controller]
	if !ok {
		t.Fatalf("%s was rewritten and must carry a source map", controller)
	}
	if sourceMap.Version != 3 || sourceMap.Mappings == "" || sourceMap.File != "TypedBodyController.ts" {
		t.Fatalf("%s must carry a version 3 map for TypedBodyController.ts with mappings: %+v", controller, sourceMap)
	}
	if len(sourceMap.Sources) != 1 || sourceMap.Sources[0] != "TypedBodyController.ts" {
		t.Fatalf("the %s map must name TypedBodyController.ts as its one source: %v", controller, sourceMap.Sources)
	}
	authored := mustReadFile(t, filepath.Join(root, controller))
	if len(sourceMap.SourcesContent) != 1 || sourceMap.SourcesContent[0] == nil || *sourceMap.SourcesContent[0] != authored {
		t.Fatalf("the %s map must carry the file on disk as its sourcesContent", controller)
	}

	structure := filepath.Join(root, "src/api/structures/ISystem.ts")
	outPath := filepath.Join(t.TempDir(), "out.ts")
	if code := transform.Run([]string{
		"transform",
		"--cwd", root,
		"--tsconfig", "tsconfig.json",
		"--file", structure,
		"--out", outPath,
		"--plugins-json", coreNativePlugins("validate", "assert"),
	}); code != 0 {
		t.Fatalf("single-file transform of ISystem.ts exited %d", code)
	}
	single, err := os.ReadFile(outPath)
	if err != nil {
		t.Fatal(err)
	}
	if want := mustReadFile(t, structure); string(single) != want {
		t.Fatalf("single-file mode must print an untouched file as written:\nwant %q\ngot  %q", want, string(single))
	}
}
