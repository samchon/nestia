package transform

import (
	"encoding/json"
	"path/filepath"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// SourceFilePackageName returns the nearest package-scope manifest's name for a
// resolved declaration source. A node_modules boundary ends the scope before
// its manifest is read. Missing, unreadable or malformed ownership
// returns an empty name; a foreign or invalid nearest manifest never falls
// through to an enclosing package.
//
// The loaded program filesystem owns path resolution, including its overlays
// and dependency observations. This performs one ancestor walk without retaining
// programs or caching an owner across unrelated compilation requests.
//
// @evidence contracts/common.md#principled-implementation Node's LOOKUP_PACKAGE_SCOPE ends at the node_modules path component before reading a manifest there. Within that scope the nearest manifest's decoded name decides declaration identity. A present unreadable or invalid manifest also stops resolution, so neither a manifestless dependency nor an invalid foreign owner inherits an enclosing core, rxjs, tgrid or typia owner.
// @evidence contracts/common.md#clear-and-simple-design One ancestor loop returns one decoded name, with nil, package-scope boundary and filesystem-root termination. All declaration provenance consumers share this operation rather than duplicating ownership policies.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The literal node_modules component establishes Node's documented scope boundary, not package identity. No library-directory spelling, fixture name or type name substitutes for the actual scoped manifest name. Reads use the program filesystem.
// @evidence contracts/common.md#meaningful-documentation The comment defines scoped nearest-manifest semantics, boundary-before-read termination, empty results, overlay ownership and the absence of cross-program retention. The rule follows Node's ESM resolution LOOKUP_PACKAGE_SCOPE specification.
// @evidence contracts/portability.md#os-neutral-implementation filepath.Dir, Base and Join represent native path components, and the driver's filesystem performs reads/existence checks. Exact node_modules component comparison follows Node's scope algorithm; no shell path or slash-substring membership test is composed.
// @evidence contracts/performance.md#efficient-algorithms One read per ancestor and an existence check only after a failed read cost O(directory depth plus the first manifest's bytes). No source graph or dependency tree is recursively searched.
// @evidence contracts/performance.md#reuse-equivalent-work The program filesystem supplies its own coherent read/overlay observation model. This operation shares no result across programs because manifest inputs and overlays may differ between requests.
// @evidence contracts/performance.md#bound-retention-and-release-resources Only the current ancestor string and one manifest buffer/decoded name are retained; no program pointer, global owner map, descriptor or filesystem handle survives the call.
func SourceFilePackageName(prog *driver.Program, source *shimast.SourceFile) string {
	if prog == nil || prog.FS == nil || source == nil {
		return ""
	}
	for directory := filepath.Dir(source.FileName()); ; {
		if filepath.Base(directory) == "node_modules" {
			return ""
		}
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
