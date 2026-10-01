package transform

import (
	"encoding/json"
	"path/filepath"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// SourceFilePackageName returns the nearest manifest's package name for a
// resolved declaration source. Missing, unreadable or malformed ownership
// returns an empty name; a foreign or invalid nearest manifest never falls
// through to an enclosing package.
//
// The loaded program filesystem owns path resolution, including its overlays
// and dependency observations. This performs one ancestor walk without retaining
// programs or caching an owner across unrelated compilation requests.
//
// @evidence contracts/common.md#principled-implementation The first ancestor package.json owns the source, so its decoded name decides identity independently of directory spelling. A present but unreadable or invalid manifest stops resolution, preventing nested foreign ownership from falling through to an outer core or typia package.
// @evidence contracts/common.md#clear-and-simple-design One ancestor loop returns one decoded name, with nil and filesystem-root termination. Core decorator and SDK typia provenance share this same operation rather than duplicating ownership policies.
// @evidence contracts/common.md#prohibited-implementation-shortcuts No workspace layout, installed folder fragment, fixture name or type name substitutes for actual manifest ownership. Reads use the program filesystem, not an unrelated operating-system snapshot.
// @evidence contracts/common.md#meaningful-documentation The comment defines nearest-manifest semantics, empty results, overlay ownership and the absence of cross-program retention.
// @evidence contracts/portability.md#os-neutral-implementation filepath.Dir and Join represent native parent paths, and the driver's filesystem performs reads/existence checks; the operation composes neither shell paths nor slash-based membership tests.
// @evidence contracts/performance.md#efficient-algorithms One read per ancestor and an existence check only after a failed read cost O(directory depth plus the first manifest's bytes). No source graph or dependency tree is recursively searched.
// @evidence contracts/performance.md#reuse-equivalent-work The program filesystem supplies its own coherent read/overlay observation model. This operation shares no result across programs because manifest inputs and overlays may differ between requests.
// @evidence contracts/performance.md#bound-retention-and-release-resources Only the current ancestor string and one manifest buffer/decoded name are retained; no program pointer, global owner map, descriptor or filesystem handle survives the call.
func SourceFilePackageName(prog *driver.Program, source *shimast.SourceFile) string {
	if prog == nil || prog.FS == nil || source == nil {
		return ""
	}
	for directory := filepath.Dir(source.FileName()); ; {
		manifest := filepath.Join(directory, "package.json")
		if contents, ok := prog.FS.ReadFile(manifest); ok {
			var pack struct {
				Name string `json:"name"`
			}
			if json.Unmarshal([]byte(contents), &pack) != nil {
				return ""
			}
			return pack.Name
		} else if prog.FS.FileExists(manifest) {
			return ""
		}
		parent := filepath.Dir(directory)
		if parent == directory {
			return ""
		}
		directory = parent
	}
}
