package test

import (
	"os"
	"path/filepath"
	"testing"

	nativesdk "github.com/samchon/nestia/packages/sdk/native/sdk"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// Verifies an SDK operation diagnostic points at the method it names, not at
// the leading trivia before it.
//
// The position came from the method node's Pos(), its full start, which is the
// end of the previous line: the class line for the first member, the previous
// method's closing brace otherwise, and before any JSDoc (#1725).
//
//  1. Author a documented first method and an undocumented second one, each
//     with a header type the SDK cannot send.
//  2. Run the SDK metadata pass.
//  3. Assert each diagnostic's line and column are the method's first token.
func TestSyntheticDiagnosticPosition(t *testing.T) {
	controller := `import core from "@nestia/core";
import { WebSocketAcceptor } from "tgrid";

export interface IProvider { greet(): string; }

export class SyntheticController {
  /**
   * A documented route.
   */
  @core.WebSocketRoute("documented")
  public async documented(
    @core.WebSocketRoute.Acceptor() acceptor: WebSocketAcceptor<null, IProvider, null>,
  ): Promise<void> {}

  @core.WebSocketRoute("plain")
  public async plain(
    @core.WebSocketRoute.Acceptor() acceptor: WebSocketAcceptor<string, IProvider, null>,
  ): Promise<void> {}
}
`
	expected := map[string][2]int{
		`"acceptor" has the header type "null"`:   {10, 3},
		`"acceptor" has the header type "string"`: {15, 3},
	}

	root := repoRoot(t)
	temp := t.TempDir()
	controllers := filepath.Join(temp, "src", "controllers")
	if err := os.MkdirAll(controllers, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(controllers, "SyntheticController.ts"), []byte(controller), 0o644); err != nil {
		t.Fatal(err)
	}
	writeSyntheticTsconfig(t, root, temp)
	prog, diags, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
	if err != nil {
		t.Fatalf("load synthetic program: %v", err)
	}
	if len(diags) > 0 {
		t.Fatalf("unexpected synthetic load diagnostics: %v", diags)
	}
	defer prog.Close()

	_, reported := nativesdk.EmitTransform(prog)
	for needle, position := range expected {
		found := false
		for _, d := range reported {
			if containsText(d.Message, needle) {
				found = true
				if d.Line != position[0] || d.Column != position[1] {
					t.Errorf("%s is reported at %d:%d, not at the method's %d:%d", needle, d.Line, d.Column, position[0], position[1])
				}
			}
		}
		if found == false {
			t.Errorf("no diagnostic for %s", needle)
		}
	}
}

func containsText(haystack, needle string) bool {
	for i := 0; i+len(needle) <= len(haystack); i++ {
		if haystack[i:i+len(needle)] == needle {
			return true
		}
	}
	return false
}
