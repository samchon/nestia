package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// TestTransformWebSocketRouteDeclaringPackage verifies the WebSocket acceptor
// type is identified by the package that declares it, not by a folder name.
//
// The validator accepted any declaration whose file path contained "/tgrid/",
// so a user type in a folder of that name passed as tgrid's acceptor. The
// declaring package is now the nearest manifest, which must name tgrid.
//
//  1. Author one controller whose acceptor class lives in a folder named tgrid.
//  2. Vary only the manifest beside it: tgrid, another name, and invalid JSON.
//  3. Assert the tgrid manifest is accepted and the others are rejected with the
//     WebSocketRoute diagnostic and exit 3.
//
// @evidence contracts/testing.md#behavioral-verification The three subtests run the native transform on the same source and folder spelling and require the acceptor diagnostic only when the nearest manifest does not name tgrid, which a path-substring test cannot produce.
// @evidence contracts/testing.md#independent-expectations Handwritten manifests state the owner, and the diagnostic text is the validator's documented acceptor rule, not output of the code under test.
// @evidence contracts/testing.md#distinguishing-cases The tgrid manifest is the positive twin, a different name and an unreadable manifest are the negatives, and the identical folder spelling isolates ownership from path.
// @evidence contracts/testing.md#execution-ownership Go discovers this core unit Test and runs the native dispatcher in-process over a t.TempDir project; no host binary, installation or workspace package is touched.
func TestTransformWebSocketRouteDeclaringPackage(t *testing.T) {
	const message = `parameter "acceptor" must have WebSocketAcceptor<Header, Provider, Listener> type.`
	for _, item := range []struct {
		name, manifest string
		accepted       bool
	}{
		{"tgrid", `{"name":"tgrid"}`, true},
		{"not-tgrid", `{"name":"not-tgrid"}`, false},
		{"invalid-manifest", `{`, false},
	} {
		t.Run(item.name, func(t *testing.T) {
			root := t.TempDir()
			write := func(location, content string) {
				file := filepath.Join(root, filepath.FromSlash(location))
				if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(file, []byte(content), 0o644); err != nil {
					t.Fatal(err)
				}
			}
			// both declarations live in a folder named tgrid, so the folder
			// spelling is the same in every case and only the manifest differs
			write("tgrid/package.json", item.manifest)
			write("tgrid/index.ts", "export declare class WebSocketAcceptor<Header, Provider, Listener> { }\n")
			writeCoreDeclarationPackage(t, root, `export function WebSocketRoute(path: string): any;
export namespace WebSocketRoute { function Acceptor(): any; }`)
			write("controller.ts", `import { WebSocketRoute } from "@nestia/core";

import { WebSocketAcceptor } from "./tgrid";

export class Controller {
  @WebSocketRoute("connect")
  public connect(
    @WebSocketRoute.Acceptor()
    acceptor: WebSocketAcceptor<{}, {}, {}>,
  ): void {
    void acceptor;
  }
}
`)
			write("tsconfig.json", `{"compilerOptions":{"target":"ES2022","module":"commonjs","ignoreDeprecations":"6.0","experimentalDecorators":true,"noLib":true},"files":["controller.ts"]}`)
			_, stderr, code := runCoreNative([]string{
				"transform",
				"--cwd", root,
				"--tsconfig", filepath.Join(root, "tsconfig.json"),
				"--file", filepath.Join(root, "controller.ts"),
				"--plugins-json", coreNativePlugins("validate", "assert"),
			})
			rejected := code == 3 && strings.Contains(stderr, "error TS(nestia.core.WebSocketRoute): "+message)
			if item.accepted && (code != 0 || strings.Contains(stderr, message)) {
				t.Fatalf("a declaration owned by tgrid was rejected (exit %d):\n%s", code, stderr)
			}
			if !item.accepted && !rejected {
				t.Fatalf("a declaration not owned by tgrid was accepted (exit %d):\n%s", code, stderr)
			}
		})
	}
}
