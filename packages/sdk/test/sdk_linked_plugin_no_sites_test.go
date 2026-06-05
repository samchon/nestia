package test

import (
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// Verifies linkedPlugin.ApplyProgram is a no-op (injects nothing) when the
// program carries no controller method sites.
//
// ApplyProgram's zero-site early return (register.go:62-64) is the branch a
// structure-only file takes; the happy-path linked-plugin test always loads a
// controller, so that arm stays dark. Driving ApplyLinkedPlugins over a program
// with only a structure file exercises it in-process with no disk emit, and the
// file's statement list must keep no injected @nestia/sdk namespace import.
//
//  1. LoadProgram over a single structure file with the SDK contributor named in
//     TTSC_LINKED_PLUGINS_JSON.
//  2. Trigger ApplyLinkedPlugins through SourceFiles.
//  3. Assert the structure file received no injected namespace import.
func TestSDKLinkedPluginNoOpWithoutSites(t *testing.T) {
	root := repoRoot(t)
	temp := writeFeatureTsconfig(t, root, "body", []string{
		"api/structures/IBbsArticle.ts",
	})
	t.Setenv(driver.LinkedPluginsEnv, sdkLinkedPluginsJSON)

	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatalf("load program: %v", err)
	}
	if len(diags) > 0 {
		t.Fatalf("unexpected load diagnostics: %v", diags)
	}
	defer prog.Close()

	files := prog.SourceFiles()
	structure := findSourceFile(t, files, "IBbsArticle.ts")
	if hasInjectedNamespaceImport(structure) {
		t.Fatal("ApplyProgram injected an @nestia/sdk import into a site-less file")
	}
	// Sanity: no method in the structure file carries a synthesized decorator.
	if methodCount(structure) != 0 {
		t.Fatalf("structure fixture unexpectedly declares methods")
	}
}

// methodCount counts method declarations in a file, used to assert a structure
// file carries none.
func methodCount(file *shimast.SourceFile) int {
	count := 0
	var walk func(n *shimast.Node)
	walk = func(n *shimast.Node) {
		if n == nil {
			return
		}
		if n.Kind == shimast.KindMethodDeclaration {
			count++
		}
		n.ForEachChild(func(c *shimast.Node) bool { walk(c); return false })
	}
	walk(file.AsNode())
	return count
}
