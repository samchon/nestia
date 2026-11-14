package test

import (
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimcore "github.com/microsoft/typescript-go/shim/core"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// The driver pairs LinkedPluginsEnv entries with registrations by position.
// Go runs package init functions in file-name order, so this registration
// follows the one in build_emit_external_observations_test.go and answers
// entry 1. The contributor collector stays inert without its sentinel entry.
func init() {
	driver.RegisterPlugin(rewrittenOutsideNestiaLinkedPlugin{})
	transform.RegisterEmitTransformCollector(rewrittenOutsideNestiaContributor)
}

// TestTransformPrintsFilesRewrittenOutsideNestia verifies a file whose
// SourceFile comes back unchanged is still printed, with a map back to its
// authored text, when something other than a rebuilding transformer rewrote
// it.
//
// The transform host publishes an untouched file as its parsed text instead of
// printing it (samchon/nestia#1809). An unchanged pointer proves nothing for a
// contributor that edits in place, as @nestia/sdk's metadata pass does, or
// under a linked ProgramPlugin, and a linked source preamble is inserted into
// the parsed text; publishing that text would drop the edit or leak the
// preamble without a usable map.
//
//  1. Run project-mode transform over the body fixture with a contributor that
//     rewrites a literal of ISystem.ts in place and returns its SourceFile.
//  2. Repeat with a linked ProgramPlugin making the same in-place edit.
//  3. Repeat with a linked source preamble.
//  4. Assert each publishes ISystem.ts with the edit or the preamble and a map
//     whose `sourcesContent` is the file on disk.
//
// @evidence contracts/testing.md#behavioral-verification Each envelope publishes ISystem.ts with the contributor's or linked plugin's rewritten literal, or with the preamble, and a version 3 map whose sourcesContent is the file on disk.
// @evidence contracts/testing.md#independent-expectations The fixture file on disk and the literal the fixture hooks write are the oracles; no expected text is printed by the host under test.
// @evidence contracts/testing.md#distinguishing-cases An in-place contributor, an in-place linked ProgramPlugin and a preamble each leave the returned SourceFile pointer unchanged; publishing the parsed text loses the edit in the first two and an uncorrected map carries the preamble in the third. The linked observation fixture at entry 0 is itself a ProgramPlugin, so the preamble case does not isolate the preamble guard from the ProgramPlugin guard.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit function and executes the native dispatcher in the test process against authored fixture source. Registrations stay inert outside their sentinel entry and the LinkedPluginsEnv payload t.Setenv restores; no consumer installation or native host process is started.
func TestTransformPrintsFilesRewrittenOutsideNestia(t *testing.T) {
	root := featureRootForCore(t, "body")
	source := "src/api/structures/ISystem.ts"
	authored := mustReadFile(t, filepath.Join(root, source))

	t.Run("in-place contributor", func(t *testing.T) {
		plugins := `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"validate","stringify":"assert"}},` +
			`{"name":"` + rewrittenOutsideNestiaSentinel + `","stage":"transform","config":{}}]`
		envelope := runProjectTransformEnvelopeWithPlugins(t, "body", plugins)
		rewrittenOutsideNestiaAssertEdited(t, envelope.TypeScript[source])
		rewrittenOutsideNestiaAssertMap(t, envelope.SourceMaps, source, authored)
	})

	for _, mode := range []string{"edit", "preamble"} {
		t.Run("linked "+mode, func(t *testing.T) {
			external := filepath.Join(t.TempDir(), "external.txt")
			writeFile(t, external, "external-transform-input")
			payload, err := json.Marshal([]driver.PluginEntry{
				{Name: "observation-fixture", Stage: "transform", Config: map[string]any{"file": external, "mode": "complete"}},
				{Name: "rewritten-outside-nestia", Stage: "transform", Config: map[string]any{"mode": mode}},
			})
			if err != nil {
				t.Fatal(err)
			}
			t.Setenv(driver.LinkedPluginsEnv, string(payload))
			envelope := runProjectTransformEnvelope(t, "body")
			text := envelope.TypeScript[source]
			if mode == "edit" {
				rewrittenOutsideNestiaAssertEdited(t, text)
			} else if !strings.Contains(text, rewrittenOutsideNestiaPreamble) {
				t.Fatalf("%s must be published with the linked preamble:\n%s", source, text)
			}
			rewrittenOutsideNestiaAssertMap(t, envelope.SourceMaps, source, authored)
		})
	}
}

const (
	rewrittenOutsideNestiaSentinel = "test-in-place-contributor"
	rewrittenOutsideNestiaPreamble = "// rewritten-outside-nestia banner"
	rewrittenOutsideNestiaFrom     = "git"
	rewrittenOutsideNestiaTo       = "edited-in-place"
)

func rewrittenOutsideNestiaAssertEdited(t *testing.T, text string) {
	t.Helper()
	if !strings.Contains(text, `"`+rewrittenOutsideNestiaTo+`"`) || strings.Contains(text, `"`+rewrittenOutsideNestiaFrom+`"`) {
		t.Fatalf("ISystem.ts must be published with the in-place edit:\n%s", text)
	}
}

func rewrittenOutsideNestiaAssertMap(t *testing.T, maps map[string]projectTransformMap, source, authored string) {
	t.Helper()
	sourceMap, ok := maps[source]
	if !ok {
		t.Fatalf("%s was printed and must carry a source map", source)
	}
	if sourceMap.Version != 3 || sourceMap.Mappings == "" || len(sourceMap.Sources) != 1 || sourceMap.Sources[0] != "ISystem.ts" {
		t.Fatalf("%s must carry a version 3 map for ISystem.ts: %+v", source, sourceMap)
	}
	if len(sourceMap.SourcesContent) != 1 || sourceMap.SourcesContent[0] == nil || *sourceMap.SourcesContent[0] != authored {
		t.Fatalf("the %s map must carry the file on disk as its sourcesContent", source)
	}
}

// rewrittenOutsideNestiaContributor is a contributor shaped like @nestia/sdk's
// metadata pass: it edits the tree in place and returns the SourceFile it was
// given.
func rewrittenOutsideNestiaContributor(_ *driver.Program, plan plugin.Plan) (driver.PluginTransform, []transform.Diagnostic) {
	for _, entry := range plan.Entries {
		if entry.Name == rewrittenOutsideNestiaSentinel {
			return func(_ *shimprinter.EmitContext, sf *shimast.SourceFile) *shimast.SourceFile {
				rewrittenOutsideNestiaRewrite(sf.AsNode())
				return sf
			}, nil
		}
	}
	return nil, nil
}

// rewrittenOutsideNestiaLinkedPlugin is a linked plugin that, by its entry's
// mode, edits every program tree in place like @ttsc/paths or contributes a
// source preamble like @ttsc/banner.
type rewrittenOutsideNestiaLinkedPlugin struct{}

func (rewrittenOutsideNestiaLinkedPlugin) ApplyProgram(prog *driver.Program, ctx driver.PluginContext) error {
	if ctx.Entry.Config["mode"] != "edit" {
		return nil
	}
	for _, sf := range prog.SourceFiles() {
		rewrittenOutsideNestiaRewrite(sf.AsNode())
	}
	return nil
}

func (rewrittenOutsideNestiaLinkedPlugin) SourcePreamble(ctx driver.PluginContext) (string, error) {
	if ctx.Entry.Config["mode"] != "preamble" {
		return "", nil
	}
	return rewrittenOutsideNestiaPreamble + "\n", nil
}

func rewrittenOutsideNestiaRewrite(node *shimast.Node) {
	if node == nil {
		return
	}
	if node.Kind == shimast.KindStringLiteral && node.Text() == rewrittenOutsideNestiaFrom {
		node.AsStringLiteral().Text = rewrittenOutsideNestiaTo
		node.Flags |= shimast.NodeFlagsSynthesized
		node.Loc = shimcore.UndefinedTextRange()
	}
	node.ForEachChild(func(child *shimast.Node) bool {
		rewrittenOutsideNestiaRewrite(child)
		return false
	})
}
