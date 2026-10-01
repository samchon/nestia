package test

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// sdkLinkedPluginsEnv tells the ttsc driver that one linked plugin — the SDK
// contributor — is present, so it invokes the plugin the blank import in
// cmd/ttsc-nestia-sdk registers. ttsc sets this env for real contributor
// builds; the test-support host reproduces it.
const sdkLinkedPluginsEnv = `TTSC_LINKED_PLUGINS_JSON=[{"name":"@nestia/sdk","stage":"transform","config":{"transform":"@nestia/sdk/lib/transform"}}]`

// extractAllOperationMetadataLiterals scans build output for every
// __OperationMetadata.OperationMetadata("<json>") call and returns the decoded
// metadata JSON of each.
//
// The SDK contributor injects metadata as one JSON string literal that the
// OperationMetadata decorator JSON.parses at runtime (see
// packages/sdk/native/sdk/register.go). The emitter prints that argument as a
// double-quoted JS string literal — itself a valid JSON string — so a single
// json.Unmarshal pass unescapes it back to the raw metadata JSON that
// json.Marshal produced in packages/sdk/native/sdk/sdk_metadata_json.go.
func extractAllOperationMetadataLiterals(data []byte) ([][]byte, error) {
	const needle = "__OperationMetadata.OperationMetadata("
	var literals [][]byte
	for rest := data; ; {
		idx := bytes.Index(rest, []byte(needle))
		if idx < 0 {
			break
		}
		rest = rest[idx+len(needle):]
		start := 0
		for start < len(rest) && (rest[start] == ' ' || rest[start] == '\t' || rest[start] == '\n' || rest[start] == '\r') {
			start++
		}
		if start >= len(rest) || rest[start] != '"' {
			return nil, &literalError{msg: "OperationMetadata argument is not a string literal"}
		}
		end := start + 1
		for end < len(rest) && rest[end] != '"' {
			if rest[end] == '\\' {
				end++
			}
			end++
		}
		if end >= len(rest) {
			return nil, &literalError{msg: "unterminated OperationMetadata string literal"}
		}
		var inner string
		if err := json.Unmarshal(rest[start:end+1], &inner); err != nil {
			return nil, &literalError{msg: "OperationMetadata literal is not a decodable JS string: " + err.Error()}
		}
		literals = append(literals, []byte(inner))
		rest = rest[end+1:]
	}
	if len(literals) == 0 {
		return nil, &literalError{msg: "OperationMetadata call not found"}
	}
	return literals, nil
}

// extractFirstOperationMetadataLiteral returns the decoded metadata JSON of the
// first OperationMetadata call, ready for json.Unmarshal.
func extractFirstOperationMetadataLiteral(data []byte) ([]byte, error) {
	literals, err := extractAllOperationMetadataLiterals(data)
	if err != nil {
		return nil, err
	}
	return literals[0], nil
}

// extractOperationMetadataJSON decodes every OperationMetadata literal in the
// build output and joins them with newlines, so a substring assertion can scan
// the metadata regardless of which controller method carries it.
func extractOperationMetadataJSON(t *testing.T, data []byte) string {
	t.Helper()
	literals, err := extractAllOperationMetadataLiterals(data)
	if err != nil {
		t.Fatalf("could not locate __OperationMetadata literal: %v\n%s", err, data)
	}
	parts := make([]string, len(literals))
	for i, literal := range literals {
		parts[i] = string(literal)
	}
	return strings.Join(parts, "\n")
}

type literalError struct{ msg string }

func (e *literalError) Error() string { return e.msg }

func repoRoot(t *testing.T) string {
	t.Helper()
	root, err := filepath.Abs("../../..")
	if err != nil {
		t.Fatal(err)
	}
	return root
}

func nodeTypeRoots(t *testing.T, root string) string {
	t.Helper()
	candidates := []string{
		filepath.Join(root, "node_modules/@types"),
	}
	matches, err := filepath.Glob(filepath.Join(root, "node_modules/.pnpm/@types+node@*/node_modules/@types"))
	if err != nil {
		t.Fatal(err)
	}
	candidates = append(candidates, matches...)
	for _, candidate := range candidates {
		if _, err := os.Stat(filepath.Join(candidate, "node")); err == nil {
			return filepath.ToSlash(candidate)
		}
	}
	t.Fatal("unable to locate @types/node")
	return ""
}

func emittedJSPath(t *testing.T, root string, outDir string, source string) string {
	t.Helper()
	rel, err := filepath.Rel(root, source)
	if err != nil {
		t.Fatal(err)
	}
	return filepath.Join(outDir, strings.TrimSuffix(rel, filepath.Ext(rel))+".js")
}
