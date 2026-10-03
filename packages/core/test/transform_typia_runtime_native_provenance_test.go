package test

import (
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"
)

// TestTransformTypiaRuntimeNativeProvenance verifies the composed typia analysis
// distinguishes a user global Blob from the actual DOM runtime declaration.
//
// A lib.*.d.ts filename does not confer default-library authority. Core must
// register the program's classifier before typia analyzes either declaration;
// otherwise the authored global loses its required member to instanceof Blob.
//
//  1. Author the same Blob-bearing payload and typia call in two programs.
//  2. Supply a misleading user library without DOM, then the real DOM library.
//  3. Require structural member validation or native identity respectively.
//
// @evidence contracts/testing.md#behavioral-verification The actual core-composed source transform retains customField and omits instanceof Blob for an authored global, while the DOM program emits instanceof Blob and omits customField. A filename-based native promotion or missing classifier fails these contrasting outputs.
// @evidence contracts/testing.md#independent-expectations An authored interface has structural TypeScript semantics; the standard DOM Blob is a supported runtime-native identity. The compiler library configuration and independently authored required member establish the oracle, rather than a snapshot of generated source.
// @evidence contracts/testing.md#distinguishing-cases Both programs use identical payload and call text. Only declaration provenance changes: misleading lib.custom.d.ts without DOM versus the actual DOM default library. This owns source classification, while shared SDK consumers own installed validator execution; no runtime success is claimed by output markers.
// @evidence contracts/testing.md#execution-ownership Go discovers this matching Test and invokes the owning composed source operation in-process. Temporary authored declarations are language inputs; no native binary, JavaScript consumer, installation, Node process or host is prepared.
func TestTransformTypiaRuntimeNativeProvenance(t *testing.T) {
	for _, native := range []bool{false, true} {
		name := "authored-global"
		if native {
			name = "dom-native"
		}
		t.Run(name, func(t *testing.T) {
			root := t.TempDir()
			writeFile(t, filepath.Join(root, "main.ts"), `import typia from "typia";
interface IPayload { blob: Blob; }
export const check = typia.createIs<IPayload>();`)
			files := []string{"main.ts"}
			libraries := []string{"ESNext"}
			if native {
				libraries = append(libraries, "DOM")
			} else {
				writeFile(t, filepath.Join(root, "lib.custom.d.ts"), `interface Blob { customField: string; }`)
				files = append(files, "lib.custom.d.ts")
			}
			config, err := json.Marshal(map[string]any{
				"compilerOptions": map[string]any{
					"target": "ES2022", "module": "commonjs", "strict": true,
					"esModuleInterop": true, "skipLibCheck": true, "ignoreDeprecations": "6.0",
					"lib": libraries, "types": []string{},
					"paths": map[string][]string{"typia": {filepath.ToSlash(filepath.Join(repoRootForCore(t), "packages/core/node_modules/typia/lib/module.d.ts"))}},
				},
				"files": files,
			})
			if err != nil {
				t.Fatal(err)
			}
			writeFile(t, filepath.Join(root, "tsconfig.json"), string(config))
			out, diagnostics, code := runCoreNative([]string{"transform", "--cwd", root, "--tsconfig", "tsconfig.json", "--file", "main.ts", "--plugins-json", coreNativePlugins("assert", "assert")})
			if code != 0 {
				t.Fatalf("composed source transform exited %d: %s", code, diagnostics)
			}
			if strings.Contains(out, "typia.createIs<") {
				t.Fatalf("validator was not specialized: %s", out)
			}
			if strings.Contains(out, "instanceof Blob") != native || strings.Contains(out, "customField") == native {
				t.Fatalf("wrong Blob declaration classification for %s: %s", name, out)
			}
		})
	}
}
