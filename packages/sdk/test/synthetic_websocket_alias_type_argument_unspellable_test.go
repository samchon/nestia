package test

import (
	nativesdk "github.com/samchon/nestia/packages/sdk/native/sdk"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestSyntheticWebSocketAliasTypeArgumentUnspellable verifies an unresolved nested alias argument is rejected with a useful explanation.
//
// Reflection cannot spell a substituted nested generic argument as a safe client import; silently retaining Member would produce an invalid client type.
//
// 1. Analyze an acceptor alias whose provider nests its generic parameter.
// 2. Require the acceptor, nested argument and whole-argument correction in diagnostics.
//
// @evidence contracts/testing.md#behavioral-verification SDK EmitTransform must diagnose the nested IRoom<Member> acceptor argument and tell the caller to pass a type parameter as a whole argument, instead of silently generating an unbound client type.
// @evidence contracts/testing.md#independent-expectations The alias introduces Member only within IRoom<Member>; the SDK's supported reflected import form cannot substitute that nested spelling into an independent client declaration.
// @evidence contracts/testing.md#distinguishing-cases This owns unsupported nested generic substitution; the seven-route alias matrix owns supported whole argument, defaulted, parenthesized and chained forms. It checks the reason text rather than exact total diagnostic count.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test. Its authored TypeScript program is loaded and analyzed in-process by EmitTransform with a temporary project and a closed program, without building a native artifact or starting an installed host; CLI/runtime cohorts separately own consumer assembly.
func TestSyntheticWebSocketAliasTypeArgumentUnspellable(t *testing.T) {
	const controller = `import core from "@nestia/core";
import { WebSocketAcceptor } from "tgrid";

export interface IRoom<Member> { members(): Member[]; }
type RoomAcceptor<Member> = WebSocketAcceptor<undefined, IRoom<Member>, null>;

export class SyntheticController {
  @core.WebSocketRoute("room")
  public async room(
    @core.WebSocketRoute.Acceptor() acceptor: RoomAcceptor<string>,
  ): Promise<void> {}
}
`
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
	messages := make([]string, len(reported))
	for i, d := range reported {
		messages[i] = d.String("")
	}
	joined := strings.Join(messages, "\n")
	for _, expected := range []string{
		`@WebSocketRoute.Acceptor() parameter "acceptor"`,
		`WebSocketAcceptor type argument "IRoom<Member>"`,
		"Pass each type parameter as a whole type argument",
	} {
		if strings.Contains(joined, expected) == false {
			t.Fatalf("diagnostics miss %q:\n%s", expected, joined)
		}
	}
}

// assertSyntheticReflectedType asserts a reflected type is name with type
// arguments of the given names.
