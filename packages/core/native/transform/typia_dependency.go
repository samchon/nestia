package transform

import (
	"sort"
	"strings"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// transformDependencyCollector accumulates the declaration files typia's
// metadata analysis reports while one project file is transformed, attributing
// them to that file's envelope key.
//
// These are the envelope's `dependencies`: the source files owning the
// declarations the analysis actually read to generate that file's validators and
// stringifiers. A consumer unions them with the host-owned reference graph, so
// the list is additive and an omission costs nothing; it never narrows anything
// on its own. Narrowing is what `dependenciesComplete` would do, and this
// envelope does not declare it -- see the note in runTransformProject.
type transformDependencyCollector struct {
	cwd     string
	current string
	files   map[string]map[string]bool
	// isLibraryFile reports the compiler's own classification of a file as a
	// default library. Classification must come from the program, never from a
	// file-name pattern, for the reason registerTypiaDefaultLibraryClassifier
	// records: a project's own ambient declaration file may legitimately be
	// named `lib.custom.d.ts`, and dropping it by base name silently loses cache
	// invalidation for the types it declares.
	isLibraryFile func(fileName string) bool
	// values memoizes fileName -> envelope value ("" for a dropped file). The
	// listener reports the same declaration files repeatedly across call sites.
	values map[string]string
}

func newTransformDependencyCollector(
	cwd string,
	isLibraryFile func(fileName string) bool,
) *transformDependencyCollector {
	return &transformDependencyCollector{
		cwd:           cwd,
		isLibraryFile: isLibraryFile,
		files:         map[string]map[string]bool{},
		values:        map[string]string{},
	}
}

// Begin attributes subsequent touches to the given envelope key.
func (collector *transformDependencyCollector) Begin(key string) {
	collector.current = key
}

// End closes the window Begin opened, so a touch arriving between two files is
// dropped rather than charged against whichever file happened to run last.
func (collector *transformDependencyCollector) End() {
	collector.current = ""
}

// Touch records one consulted declaration file for the current key. Default
// library files, virtual URI sources (tsgo's `bundled:///` libraries), and the
// transformed file itself are dropped: the first two are toolchain-versioned
// rather than project inputs, and the third is already the cache key.
func (collector *transformDependencyCollector) Touch(fileName string) {
	if collector.current == "" {
		return
	}
	value, memoized := collector.values[fileName]
	if memoized == false {
		value = collector.value(fileName)
		collector.values[fileName] = value
	}
	if value == "" || value == collector.current {
		return
	}
	set := collector.files[collector.current]
	if set == nil {
		set = map[string]bool{}
		collector.files[collector.current] = set
	}
	set[value] = true
}

// value renders one reported file as its envelope key, or "" when it is dropped.
// The key is driver.TransformOutputKey, the same one `typescript` and `graph`
// use, so a consumer joins every section by key.
func (collector *transformDependencyCollector) value(fileName string) string {
	if strings.Contains(fileName, "://") || collector.isLibraryFile(fileName) {
		return ""
	}
	return driver.TransformOutputKey(collector.cwd, fileName)
}

// ToJSON renders the collected sets as the envelope's `dependencies` map with
// deterministically sorted values, or nil when nothing was collected. The nil
// keeps the field off the wire entirely, which is what an envelope with nothing
// to report must send.
func (collector *transformDependencyCollector) ToJSON() map[string][]string {
	if len(collector.files) == 0 {
		return nil
	}
	output := map[string][]string{}
	for key, set := range collector.files {
		if len(set) == 0 {
			continue
		}
		values := make([]string, 0, len(set))
		for value := range set {
			values = append(values, value)
		}
		sort.Strings(values)
		output[key] = values
	}
	if len(output) == 0 {
		return nil
	}
	return output
}
