package main

import (
	"fmt"
	"sort"
	"strings"
)

func cleanupTransformedText(text string) string {
	return cleanupTransformedTextWithRuntimeAliases(text, nil)
}

func cleanupTransformedTextWithRuntimeAliases(text string, aliases []string) string {
	text = removeUnusedTypiaImports(text)
	if aliases == nil {
		return injectCleanupRuntimeImports(text)
	}
	return injectCleanupRuntimeImportsWithAliases(text, aliases)
}

func removeUnusedTypiaImports(text string) string {
	prefix := cleanupImportScanPrefix(text)
	if !strings.Contains(prefix, `require("typia")`) &&
		!strings.Contains(prefix, `require('typia')`) &&
		!strings.Contains(prefix, `from "typia"`) &&
		!strings.Contains(prefix, `from 'typia'`) {
		return text
	}
	type removal struct {
		start int
		end   int
	}
	removals := []removal{}
	offset := 0
	for offset < len(prefix) {
		next := strings.IndexByte(prefix[offset:], '\n')
		lineEnd := len(prefix)
		nextOffset := len(prefix)
		if next >= 0 {
			lineEnd = offset + next
			nextOffset = lineEnd + 1
		}
		line := strings.TrimSuffix(prefix[offset:lineEnd], "\r")
		if alias, ok := unusedTypiaImportAlias(line); ok &&
			!cleanupIdentifierStillReferenced(text, alias, offset, nextOffset) {
			removals = append(removals, removal{start: offset, end: nextOffset})
		}
		offset = nextOffset
	}
	for i := len(removals) - 1; i >= 0; i-- {
		r := removals[i]
		text = text[:r.start] + text[r.end:]
	}
	return text
}

func unusedTypiaImportAlias(line string) (string, bool) {
	if strings.HasPrefix(line, "const ") {
		index := strings.Index(line, " = ")
		if index < 0 {
			return "", false
		}
		alias := strings.TrimSpace(strings.TrimPrefix(line[:index], "const "))
		if isTypiaImportAlias(alias) == false {
			return "", false
		}
		value := strings.TrimSpace(line[index+3:])
		return alias, value == `__importDefault(require("typia"));` ||
			value == `__importDefault(require('typia'));` ||
			value == `require("typia");` ||
			value == `require('typia');`
	}
	if strings.HasPrefix(line, "import ") && strings.HasSuffix(line, ` from "typia";`) {
		alias := strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(line, "import "), ` from "typia";`))
		return alias, isTypiaImportAlias(alias)
	}
	if strings.HasPrefix(line, "import ") && strings.HasSuffix(line, ` from 'typia';`) {
		alias := strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(line, "import "), ` from 'typia';`))
		return alias, isTypiaImportAlias(alias)
	}
	return "", false
}

func isTypiaImportAlias(alias string) bool {
	if alias == "typia" {
		return true
	}
	if !strings.HasPrefix(alias, "typia_") {
		return false
	}
	for _, ch := range alias[len("typia_"):] {
		if ch < '0' || ch > '9' {
			return false
		}
	}
	return len(alias) > len("typia_")
}

func cleanupIdentifierStillReferenced(text, alias string, lineStart, lineEnd int) bool {
	return cleanupIdentifierAppears(text[:lineStart], alias) ||
		cleanupIdentifierAppears(text[lineEnd:], alias)
}

func cleanupIdentifierAppears(text string, alias string) bool {
	offset := 0
	for {
		index := strings.Index(text[offset:], alias)
		if index < 0 {
			return false
		}
		start := offset + index
		end := start + len(alias)
		if (start == 0 || !isCleanupRuntimeAliasIdentifierByte(text[start-1])) &&
			(end == len(text) || !isCleanupRuntimeAliasIdentifierByte(text[end])) {
			return true
		}
		offset = end
	}
}

func injectCleanupRuntimeImports(text string) string {
	aliases := collectCleanupRuntimeAliases(text)
	return injectCleanupRuntimeImportsWithAliases(text, aliases)
}

func injectCleanupRuntimeImportsWithAliases(text string, aliases []string) string {
	if len(aliases) == 0 {
		return text
	}
	esModule := isCleanupESModuleOutput(text)
	existing := collectExistingCleanupRuntimeImports(text)
	imports := make([]string, 0, len(aliases))
	for _, alias := range aliases {
		module := cleanupRuntimeModuleOf(alias)
		if existing[cleanupRuntimeImportKey(alias, module)] {
			continue
		}
		name := cleanupRuntimeNameOf(alias)
		if esModule {
			imports = append(imports, fmt.Sprintf(`import { %s as %s } from %q;`, name, alias, module))
		} else {
			imports = append(imports, fmt.Sprintf(`const { %s: %s } = require(%q);`, name, alias, module))
		}
	}
	if len(imports) == 0 {
		return text
	}
	index := cleanupRuntimeImportInsertionIndex(text, esModule)
	return text[:index] + strings.Join(imports, "\n") + "\n" + text[index:]
}

func collectCleanupRuntimeAliases(text string) []string {
	seen := map[string]bool{}
	offset := 0
	for {
		index := strings.Index(text[offset:], cleanupRuntimeAliasPrefix)
		if index < 0 {
			break
		}
		start := offset + index
		end := start + len(cleanupRuntimeAliasPrefix)
		if start != 0 && isCleanupRuntimeAliasIdentifierByte(text[start-1]) {
			offset = end
			continue
		}
		for end < len(text) && isCleanupRuntimeAliasNameByte(text[end]) {
			end++
		}
		if end != start+len(cleanupRuntimeAliasPrefix) &&
			(end == len(text) || !isCleanupRuntimeAliasIdentifierByte(text[end])) {
			seen[text[start:end]] = true
		}
		offset = end
	}
	return sortCleanupRuntimeAliases(seen)
}

func sortCleanupRuntimeAliases(seen map[string]bool) []string {
	aliases := make([]string, 0, len(seen))
	for alias := range seen {
		aliases = append(aliases, alias)
	}
	sort.SliceStable(aliases, func(i, j int) bool {
		left, right := cleanupRuntimeAliasRank(aliases[i]), cleanupRuntimeAliasRank(aliases[j])
		if left != right {
			return left < right
		}
		return aliases[i] < aliases[j]
	})
	return aliases
}

const cleanupRuntimeAliasPrefix = "__typia_transform_"

func isCleanupRuntimeAliasNameByte(value byte) bool {
	return (value >= 'A' && value <= 'Z') ||
		(value >= 'a' && value <= 'z') ||
		(value >= '0' && value <= '9') ||
		value == '_'
}

func isCleanupRuntimeAliasIdentifierByte(value byte) bool {
	return isCleanupRuntimeAliasNameByte(value) || value == '$'
}

func cleanupRuntimeAliasRank(alias string) int {
	name := strings.TrimPrefix(alias, cleanupRuntimeAliasPrefix)
	switch {
	case strings.HasPrefix(name, "_is"):
		return 100
	case strings.HasPrefix(name, "_assert"):
		return 150
	case strings.HasPrefix(name, "_randomFormat"):
		return 200
	case name == "_randomString":
		return 210
	case name == "_randomInteger":
		return 220
	case name == "_randomNumber":
		return 221
	case strings.HasPrefix(name, "_random"):
		return 230
	case name == "_validateReport":
		return 800
	case name == "_createStandardSchema":
		return 900
	}
	return 500
}

func cleanupRuntimeModuleOf(alias string) string {
	return "typia/lib/internal/" + cleanupRuntimeNameOf(alias)
}

func cleanupRuntimeNameOf(alias string) string {
	name := strings.TrimPrefix(alias, cleanupRuntimeAliasPrefix)
	if !strings.HasPrefix(name, "_") {
		name = "_" + name
	}
	return name
}

func collectExistingCleanupRuntimeImports(text string) map[string]bool {
	output := map[string]bool{}
	forEachCleanupImportLine(cleanupImportScanPrefix(text), func(line string) {
		if !strings.Contains(line, cleanupRuntimeAliasPrefix) ||
			!strings.Contains(line, "typia/lib/internal/") {
			return
		}
		alias, ok := cleanupRuntimeImportAlias(line)
		if !ok {
			return
		}
		module, ok := cleanupRuntimeImportModule(line)
		if !ok {
			return
		}
		output[cleanupRuntimeImportKey(alias, module)] = true
	})
	return output
}

func cleanupImportScanPrefix(text string) string {
	const limit = 1 << 20
	if len(text) <= limit {
		return text
	}
	return text[:limit]
}

func cleanupRuntimeImportKey(alias string, module string) string {
	return alias + "\x00" + module
}

func forEachCleanupImportLine(text string, iterate func(string)) {
	for len(text) > 0 {
		next := strings.IndexByte(text, '\n')
		line := text
		if next >= 0 {
			line = text[:next]
			text = text[next+1:]
		} else {
			text = ""
		}
		iterate(strings.TrimSuffix(line, "\r"))
	}
}

func cleanupRuntimeImportAlias(line string) (string, bool) {
	switch {
	case strings.HasPrefix(line, "const { "):
		colon := strings.IndexByte(line, ':')
		if colon < 0 {
			return "", false
		}
		end := strings.IndexByte(line[colon+1:], '}')
		if end < 0 {
			return "", false
		}
		return cleanupFirstIdentifier(strings.TrimSpace(line[colon+1 : colon+1+end]))
	case strings.HasPrefix(line, "import { "):
		index := strings.LastIndex(line, " as ")
		if index < 0 {
			return "", false
		}
		end := strings.IndexByte(line[index+4:], '}')
		if end < 0 {
			return "", false
		}
		return cleanupFirstIdentifier(strings.TrimSpace(line[index+4 : index+4+end]))
	case strings.HasPrefix(line, "const "):
		rest := strings.TrimPrefix(line, "const ")
		index := strings.Index(rest, " = require(")
		if index < 0 {
			return "", false
		}
		return cleanupFirstIdentifier(rest[:index])
	case strings.HasPrefix(line, "import * as "):
		rest := strings.TrimPrefix(line, "import * as ")
		index := strings.Index(rest, " from ")
		if index < 0 {
			return "", false
		}
		return cleanupFirstIdentifier(rest[:index])
	default:
		return "", false
	}
}

func cleanupFirstIdentifier(text string) (string, bool) {
	fields := strings.Fields(text)
	if len(fields) == 0 {
		return "", false
	}
	name := strings.Trim(fields[0], " \t{}")
	if !strings.HasPrefix(name, cleanupRuntimeAliasPrefix) {
		return "", false
	}
	return name, true
}

func cleanupRuntimeImportModule(line string) (string, bool) {
	for _, marker := range []string{`require("`, `require('`, ` from "`, ` from '`} {
		index := strings.LastIndex(line, marker)
		if index < 0 {
			continue
		}
		start := index + len(marker)
		quote := marker[len(marker)-1]
		end := strings.IndexByte(line[start:], quote)
		if end < 0 {
			return "", false
		}
		module := line[start : start+end]
		if !strings.HasPrefix(module, "typia/lib/internal/") {
			return "", false
		}
		return module, true
	}
	return "", false
}

func isCleanupESModuleOutput(text string) bool {
	output := false
	forEachCleanupImportLine(cleanupImportScanPrefix(text), func(line string) {
		if strings.HasPrefix(line, "import ") ||
			strings.HasPrefix(line, "import{") ||
			strings.HasPrefix(line, "import*") ||
			strings.HasPrefix(line, "export ") {
			output = true
		}
	})
	return output
}

func cleanupRuntimeImportInsertionIndex(text string, esModule bool) int {
	index := 0
	if strings.HasPrefix(text, "#!") {
		if next := strings.IndexByte(text, '\n'); next >= 0 {
			index = next + 1
		} else {
			return len(text)
		}
	}
	if esModule {
		return index
	}
	for {
		next := consumeCleanupRuntimeImportPrefix(text[index:])
		if next == 0 {
			return index
		}
		index += next
	}
}

func consumeCleanupRuntimeImportPrefix(text string) int {
	for _, prefix := range []string{
		"\"use strict\";\n",
		"'use strict';\n",
		"/* @ttsc-rewritten */\n",
	} {
		if strings.HasPrefix(text, prefix) {
			return len(prefix)
		}
	}
	return 0
}
