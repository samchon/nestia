package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	nativesdk "github.com/samchon/nestia/packages/sdk/native/sdk"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// Verifies SDK diagnostics are recomputed after a rejected header is repaired.
//
// Success and failure belong to the loaded program. Reusing a source path for a
// new program must neither keep its rejection nor suppress a later rejection.
//
//  1. Analyze null, object and null handshake headers at the same source path.
//  2. Require exact rejection counts, then inspect metadata after the repair.
//
// @evidence contracts/testing.md#behavioral-verification EmitTransform reports the null header twice around a successful repair, while the corrected object header emits exactly one operation with IHeader type metadata.
// @evidence contracts/testing.md#independent-expectations SDK IConnection permits object or undefined headers, excluding null; the authored source changes only that header annotation and retains the same route and provider.
// @evidence contracts/testing.md#distinguishing-cases Rejected-valid-rejected inputs share the absolute source path and differ only in header type, detecting leaked diagnostics and incorrectly cached success as well as the ordinary predicate decision.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this direct analysis Test; each driver program is closed before its source is replaced, and no native binary, product compilation, installed host or emitted Node runtime runs.
func TestSyntheticWebSocketDiagnosticRecovery(t *testing.T) {
	root := repoRoot(t)
	temp := t.TempDir()
	file := filepath.Join(temp, "src", "SyntheticController.ts")
	if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
		t.Fatal(err)
	}
	writeSyntheticTsconfig(t, root, temp)
	for index, header := range []string{"null", "IHeader", "null"} {
		source := `import core from "@nestia/core";
import { WebSocketAcceptor } from "tgrid";
export interface IHeader { token: string; }
export interface IProvider { greet(): string; }
export class SyntheticController {
  @core.WebSocketRoute("socket")
  public async socket(@core.WebSocketRoute.Acceptor() acceptor: WebSocketAcceptor<` + header + `, IProvider, null>): Promise<void> {}
}
`
		if err := os.WriteFile(file, []byte(source), 0o644); err != nil {
			t.Fatal(err)
		}
		func() {
			prog, loadDiagnostics, err := driver.LoadProgram(temp, "tsconfig.json", driver.LoadProgramOptions{})
			if err != nil {
				t.Fatal(err)
			}
			defer prog.Close()
			if len(loadDiagnostics) != 0 {
				t.Fatalf("phase %d configuration diagnostics: %v", index, loadDiagnostics)
			}
			_, diagnostics := nativesdk.EmitTransform(prog)
			if header == "null" {
				if len(diagnostics) != 1 || !strings.Contains(diagnostics[0].Message, `has the header type "null", which the SDK cannot send`) {
					t.Fatalf("phase %d null-header diagnostics = %v", index, diagnostics)
				}
				return
			}
			if len(diagnostics) != 0 {
				t.Fatalf("repaired header retained rejection: %v", diagnostics)
			}
			literals := collectEmittedMetadata(t, prog)
			if len(literals) != 1 {
				t.Fatalf("repair operation count = %d", len(literals))
			}
			parameters := syntheticField(t, decodeSyntheticMetadata(t, literals[0]), "parameters").([]any)
			if len(parameters) != 1 {
				t.Fatalf("repair parameter count = %d", len(parameters))
			}
			if actual := canonicalJSON(t, syntheticField(t, parameters[0], "type")); !strings.Contains(actual, `"name":"IHeader"`) {
				t.Fatalf("repair acceptor lost IHeader type: %s", actual)
			}
		}()
	}
}
