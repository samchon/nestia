package main

import (
	"fmt"
	"path/filepath"
	"sort"
	"strings"
	"unicode"
)

type nativeRewrite struct {
	FilePath                   string
	RootName                   string
	Namespaces                 []string
	Method                     string
	Replacement                string
	ConsumeParens              bool
	AppendArguments            []string
	TargetExpressionCandidates []string
	SourceStart                int
	ExpectedArgumentCount      *int
	ExpectedArgumentsText      string
}

type nativeRewriteSet struct {
	byPath              map[string][]nativeRewrite
	aliasesByPath       map[string]map[string]bool
	sortedAliasesByPath map[string][]string
}

func newNativeRewriteSet() *nativeRewriteSet {
	return &nativeRewriteSet{
		byPath:              map[string][]nativeRewrite{},
		aliasesByPath:       map[string]map[string]bool{},
		sortedAliasesByPath: map[string][]string{},
	}
}

func (rs *nativeRewriteSet) Add(r nativeRewrite) {
	if r.FilePath == "" {
		return
	}
	path := filepath.ToSlash(r.FilePath)
	rs.byPath[path] = append(rs.byPath[path], r)
	rs.addRuntimeAliases(path, r.Replacement)
	for _, argument := range r.AppendArguments {
		rs.addRuntimeAliases(path, argument)
	}
}

func (rs *nativeRewriteSet) addRuntimeAliases(path string, text string) {
	for _, alias := range collectCleanupRuntimeAliases(text) {
		if rs.aliasesByPath[path] == nil {
			rs.aliasesByPath[path] = map[string]bool{}
		}
		rs.aliasesByPath[path][alias] = true
		delete(rs.sortedAliasesByPath, path)
	}
}

func (rs *nativeRewriteSet) Len() int {
	if rs == nil {
		return 0
	}
	n := 0
	for _, rewrites := range rs.byPath {
		n += len(rewrites)
	}
	return n
}

func (rs *nativeRewriteSet) Apply(outputName string, text string, cursors map[string]int) (string, error) {
	if rs == nil || len(rs.byPath) == 0 {
		return text, nil
	}
	if strings.Contains(text, "/* @ttsc-rewritten */") {
		return text, nil
	}
	srcPath, ok := rs.findSourceForOutput(outputName)
	if !ok || len(rs.byPath[srcPath]) == 0 {
		return text, nil
	}
	rewrites := rs.byPath[srcPath]
	sort.SliceStable(rewrites, func(i, j int) bool {
		left, leftOK := nativeRewriteFirstIndex(text, rewrites[i])
		right, rightOK := nativeRewriteFirstIndex(text, rewrites[j])
		if leftOK && rightOK && left != right {
			return left < right
		}
		if leftOK != rightOK {
			return leftOK
		}
		return rewrites[i].SourceStart < rewrites[j].SourceStart
	})
	pos := cursors[srcPath]
	out := text
	for pos < len(rewrites) {
		rewrite := rewrites[pos]
		replaced, ok, err := spliceNativeCall(out, rewrite)
		if err != nil {
			return "", err
		}
		if !ok {
			preview := out
			if len(preview) > 400 {
				preview = preview[:400] + "..."
			}
			return "", fmt.Errorf(
				"native rewrite: could not locate %s.%s(...) call in %s (tried roots %v; preview: %q)",
				joinNativeRootAndNamespaces(rewrite),
				rewrite.Method,
				outputName,
				candidateNativeRoots(rewrite.RootName),
				preview,
			)
		}
		out = replaced
		pos++
	}
	cursors[srcPath] = pos
	if out != text {
		out = insertNativeRewriteSentinel(out)
	}
	return out, nil
}

func (rs *nativeRewriteSet) RuntimeAliasesForOutput(outputName string) []string {
	if rs == nil || len(rs.aliasesByPath) == 0 || isJavaScriptOutput(outputName) == false {
		return nil
	}
	srcPath, ok := rs.findSourceForOutput(outputName)
	if !ok {
		return nil
	}
	if aliases, ok := rs.sortedAliasesByPath[srcPath]; ok {
		return aliases
	}
	seen := rs.aliasesByPath[srcPath]
	if len(seen) == 0 {
		rs.sortedAliasesByPath[srcPath] = []string{}
		return rs.sortedAliasesByPath[srcPath]
	}
	aliases := sortCleanupRuntimeAliases(seen)
	rs.sortedAliasesByPath[srcPath] = aliases
	return aliases
}

func nativeRewriteFirstIndex(text string, rewrite nativeRewrite) (int, bool) {
	best := -1
	for _, target := range candidateNativeTargets(rewrite) {
		hit, ok := indexNativeFlexibleCall(text, target, rewrite, 0)
		if ok == false {
			continue
		}
		if best < 0 || hit.start < best {
			best = hit.start
		}
	}
	return best, best >= 0
}

func (rs *nativeRewriteSet) findSourceForOutput(outputName string) (string, bool) {
	outSlash := strings.TrimSuffix(filepath.ToSlash(outputName), filepath.Ext(outputName))
	for path := range rs.byPath {
		srcStem := strings.TrimSuffix(filepath.ToSlash(path), filepath.Ext(path))
		if outputMatchesSourceStem(outSlash, srcStem) {
			return path, true
		}
	}
	return rs.findSourceByUniqueBase(outSlash)
}

func (rs *nativeRewriteSet) findSourceByUniqueBase(outputStem string) (string, bool) {
	base := pathBase(outputStem)
	if base == "" {
		return "", false
	}
	matched := ""
	count := 0
	for path := range rs.byPath {
		srcStem := strings.TrimSuffix(filepath.ToSlash(path), filepath.Ext(path))
		if pathBase(srcStem) != base {
			continue
		}
		matched = path
		count++
		if count > 1 {
			return "", false
		}
	}
	return matched, count == 1
}

func outputMatchesSourceStem(outputStem string, sourceStem string) bool {
	if outputStem == sourceStem {
		return true
	}
	for _, sourceRel := range sourceOutputCandidates(sourceStem) {
		for _, outputRel := range outputSourceCandidates(outputStem) {
			if sourceRel == outputRel {
				return true
			}
		}
		// Suffix-only matching is a fallback for paths that don't share a
		// recognized build marker (e.g. ttsc's virtual filesystem mirroring
		// the source tree). Require the relative path to span at least two
		// segments so a top-level source like `src/index.ts` does not match
		// every output file that happens to end in `/index.js`.
		if strings.Contains(sourceRel, "/") && strings.HasSuffix(outputStem, "/"+sourceRel) {
			return true
		}
	}
	return false
}

func pathBase(stem string) string {
	stem = strings.TrimSuffix(filepath.ToSlash(stem), "/")
	if stem == "" {
		return ""
	}
	if idx := strings.LastIndexByte(stem, '/'); idx >= 0 {
		return stem[idx+1:]
	}
	return stem
}

func isJavaScriptOutput(fileName string) bool {
	switch strings.ToLower(filepath.Ext(fileName)) {
	case ".js", ".mjs", ".cjs":
		return true
	default:
		return false
	}
}

func sourceOutputCandidates(stem string) []string {
	candidates := []string{}
	if rel, ok := suffixAfterPathMarker(stem, []string{"src", "api"}, false); ok {
		candidates = append(candidates, rel)
	}
	if rel, ok := suffixAfterPathMarker(stem, []string{"src"}, false); ok {
		candidates = append(candidates, rel)
	}
	if rel, ok := suffixAfterPathMarker(stem, []string{"test"}, true); ok {
		candidates = append(candidates, rel)
	}
	return candidates
}

func outputSourceCandidates(stem string) []string {
	candidates := []string{}
	// Mirror sourceOutputCandidates so paths whose source and output trees
	// share the same `src/` (or `test/`) root — e.g. ttsc's virtual filesystem
	// emits next to the source — can intersect on the same relative tail.
	// We intentionally do NOT include the {"src","api"} marker here: that
	// marker exists on the source side to let a source under `src/api/`
	// pretend its rel is the leaf only (so it matches an output that lacks
	// the `api/` segment); mirroring it on the output side would let two
	// unrelated files (e.g. `src/index.ts` and `src/api/index.ts`) collide
	// on the rel "index".
	for _, marker := range [][]string{{"lib"}, {"bin"}, {"dist"}, {"build"}, {"src"}} {
		if rel, ok := suffixAfterPathMarker(stem, marker, false); ok {
			candidates = append(candidates, rel)
		}
	}
	if rel, ok := suffixAfterPathMarker(stem, []string{"test"}, true); ok {
		candidates = append(candidates, rel)
	}
	return append(candidates, stem)
}

func suffixAfterPathMarker(stem string, marker []string, includeMarker bool) (string, bool) {
	segments := strings.Split(filepath.ToSlash(stem), "/")
	for i := len(segments) - len(marker); i >= 0; i-- {
		matched := true
		for j := range marker {
			if segments[i+j] != marker[j] {
				matched = false
				break
			}
		}
		if !matched {
			continue
		}
		start := i + len(marker)
		if includeMarker {
			start = i
		}
		if start >= len(segments) {
			return "", false
		}
		return strings.Join(segments[start:], "/"), true
	}
	return "", false
}

func spliceNativeCall(text string, r nativeRewrite) (string, bool, error) {
	for _, target := range candidateNativeTargets(r) {
		searchFrom := 0
		for {
			hit, ok := indexNativeFlexibleCall(text, target, r, searchFrom)
			if !ok {
				break
			}
			closePos, ok := matchNativeParen(text, hit.paren)
			if !ok {
				searchFrom = advanceNativeSearch(searchFrom, hit)
				continue
			}
			if r.ExpectedArgumentCount != nil &&
				countNativeArguments(text[hit.paren+1:closePos]) != *r.ExpectedArgumentCount {
				searchFrom = advanceNativeSearch(searchFrom, hit)
				continue
			}
			current := strings.TrimSpace(text[hit.paren+1 : closePos])
			if r.ExpectedArgumentsText != "" && compactNativeArgumentText(current) != compactNativeArgumentText(r.ExpectedArgumentsText) {
				searchFrom = advanceNativeSearch(searchFrom, hit)
				continue
			}
			if len(r.AppendArguments) != 0 {
				next := strings.Join(r.AppendArguments, ", ")
				if current != "" {
					next = current + ", " + next
				}
				replaced := text[:hit.paren+1] + next + text[closePos:]
				return replaced, true, nil
			}
			if r.ConsumeParens {
				replaced := text[:hit.start] + r.Replacement + text[closePos+1:]
				return replaced, true, nil
			}
			replaced := text[:hit.start] + r.Replacement + text[hit.paren:]
			return replaced, true, nil
		}
	}
	return text, false, nil
}

func advanceNativeSearch(current int, hit nativeCallHit) int {
	next := hit.paren + 1
	if next <= current {
		return current + 1
	}
	return next
}

func compactNativeArgumentText(text string) string {
	var builder strings.Builder
	inString := byte(0)
	escaped := false
	for i := 0; i < len(text); i++ {
		ch := text[i]
		if inString != 0 {
			builder.WriteByte(ch)
			if escaped {
				escaped = false
			} else if ch == '\\' {
				escaped = true
			} else if ch == inString {
				inString = 0
			}
			continue
		}
		switch ch {
		case '"', '\'', '`':
			inString = ch
			builder.WriteByte(ch)
		case ' ', '\t', '\r', '\n':
			continue
		default:
			builder.WriteByte(ch)
		}
	}
	return builder.String()
}

type nativeCallHit struct {
	start int
	paren int
}

func indexNativeFlexibleCall(text string, target string, r nativeRewrite, searchFrom int) (nativeCallHit, bool) {
	parts := strings.Split(target, ".")
	if len(parts) == 0 || parts[0] == "" {
		return nativeCallHit{}, false
	}
	root := parts[0]
	parts = parts[1:]
	start := searchFrom
	if start < 0 {
		start = 0
	}
	for {
		hit := strings.Index(text[start:], root)
		if hit < 0 {
			return nativeCallHit{}, false
		}
		pos := start + hit
		if pos > 0 && isNativeIdentifierPart(rune(text[pos-1])) {
			start = pos + 1
			continue
		}
		cursor := pos + len(root)
		ok := true
		for _, part := range parts {
			cursor = skipNativeWhitespace(text, cursor)
			if cursor >= len(text) || text[cursor] != '.' {
				ok = false
				break
			}
			cursor++
			cursor = skipNativeWhitespace(text, cursor)
			if !strings.HasPrefix(text[cursor:], part) {
				ok = false
				break
			}
			cursor += len(part)
		}
		cursor = skipNativeWhitespace(text, cursor)
		if ok && cursor < len(text) && text[cursor] == '(' {
			return nativeCallHit{start: pos, paren: cursor}, true
		}
		if ok {
			if wrappedStart, paren, wrapped := matchNativeCommaWrappedCall(text, pos, cursor); wrapped {
				return nativeCallHit{start: wrappedStart, paren: paren}, true
			}
		}
		start = pos + 1
	}
}

func skipNativeWhitespace(text string, pos int) int {
	for pos < len(text) {
		switch text[pos] {
		case ' ', '\t', '\r', '\n':
			pos++
		default:
			return pos
		}
	}
	return pos
}

func countNativeArguments(text string) int {
	text = strings.TrimSpace(text)
	if text == "" {
		return 0
	}
	count := 1
	depth := 0
	// templateDepths records the bracket depth at which each currently-open
	// `${...}` substitution started. When depth drops back to that level on a
	// '}' token, we pop and re-enter template-string mode.
	templateDepths := []int{}
	i := 0
	for i < len(text) {
		ch := text[i]
		switch ch {
		case '(', '[', '{':
			depth++
		case ')', ']':
			if depth > 0 {
				depth--
			}
		case '}':
			if depth > 0 {
				depth--
			}
			if n := len(templateDepths); n > 0 && templateDepths[n-1] == depth {
				templateDepths = templateDepths[:n-1]
				i++
				skipTemplateLiteral(text, &i, &templateDepths, &depth)
				continue
			}
		case '"', '\'':
			i++
			for i < len(text) && text[i] != ch {
				if text[i] == '\\' && i+1 < len(text) {
					i++
				}
				i++
			}
		case '`':
			i++
			skipTemplateLiteral(text, &i, &templateDepths, &depth)
			continue
		case ',':
			if depth == 0 {
				count++
			}
		}
		i++
	}
	return count
}

// skipTemplateLiteral advances i through a template-literal body. It exits
// either at the matching closing backtick (consuming it) or at the opening
// of a `${...}` substitution, in which case the caller resumes regular
// expression parsing and templateDepths records that we owe a return to
// template-string mode on the matching '}'.
func skipTemplateLiteral(text string, i *int, templateDepths *[]int, depth *int) {
	for *i < len(text) {
		c := text[*i]
		if c == '\\' && *i+1 < len(text) {
			*i += 2
			continue
		}
		if c == '`' {
			*i++
			return
		}
		if c == '$' && *i+1 < len(text) && text[*i+1] == '{' {
			*templateDepths = append(*templateDepths, *depth)
			*depth++
			*i += 2
			return
		}
		*i++
	}
}

func candidateNativeRoots(root string) []string {
	return []string{
		root,
		root + "_1.default",
		root + "_2.default",
		root + ".default",
		root + "_1",
		root + "_2",
	}
}

func candidateNativeTargets(r nativeRewrite) []string {
	seen := map[string]bool{}
	output := []string{}
	add := func(value string) {
		value = strings.TrimSpace(value)
		if value == "" || seen[value] {
			return
		}
		seen[value] = true
		output = append(output, value)
	}
	for _, candidate := range r.TargetExpressionCandidates {
		add(candidate)
	}
	if r.Method == "" && len(r.Namespaces) == 0 {
		for _, root := range candidateNativeRoots(r.RootName) {
			add(root)
		}
		return output
	}
	for _, root := range candidateNativeRoots(r.RootName) {
		parts := []string{root}
		parts = append(parts, r.Namespaces...)
		if r.Method != "" {
			parts = append(parts, r.Method)
		}
		add(strings.Join(parts, "."))
	}
	return output
}

func matchNativeCommaWrappedCall(text string, exprStart int, exprEnd int) (int, int, bool) {
	left := exprStart - 1
	for left >= 0 && (text[left] == ' ' || text[left] == '\t' || text[left] == '\r' || text[left] == '\n') {
		left--
	}
	if left < 0 || text[left] != ',' {
		return 0, 0, false
	}
	left--
	for left >= 0 && (text[left] == ' ' || text[left] == '\t' || text[left] == '\r' || text[left] == '\n') {
		left--
	}
	if left < 0 || text[left] != '0' {
		return 0, 0, false
	}
	left--
	for left >= 0 && (text[left] == ' ' || text[left] == '\t' || text[left] == '\r' || text[left] == '\n') {
		left--
	}
	if left < 0 || text[left] != '(' {
		return 0, 0, false
	}
	right := skipNativeWhitespace(text, exprEnd)
	if right >= len(text) || text[right] != ')' {
		return 0, 0, false
	}
	paren := skipNativeWhitespace(text, right+1)
	if paren >= len(text) || text[paren] != '(' {
		return 0, 0, false
	}
	return left, paren, true
}

func joinNativeRootAndNamespaces(r nativeRewrite) string {
	if len(r.Namespaces) == 0 {
		return r.RootName
	}
	return r.RootName + "." + strings.Join(r.Namespaces, ".")
}

func matchNativeParen(text string, pos int) (int, bool) {
	if pos >= len(text) || text[pos] != '(' {
		return 0, false
	}
	depth := 1
	for i := pos + 1; i < len(text); i++ {
		switch text[i] {
		case '(':
			depth++
		case ')':
			depth--
			if depth == 0 {
				return i, true
			}
		case '"', '\'', '`':
			q := text[i]
			j := i + 1
			for j < len(text) && text[j] != q {
				if text[j] == '\\' {
					j++
				}
				j++
			}
			i = j
		}
	}
	return 0, false
}

func isNativeIdentifierPart(r rune) bool {
	return r == '_' || r == '$' || unicode.IsLetter(r) || unicode.IsDigit(r)
}

func insertNativeRewriteSentinel(text string) string {
	for _, prefix := range []string{"\"use strict\";\n", "'use strict';\n"} {
		if strings.HasPrefix(text, prefix) {
			return prefix + "/* @ttsc-rewritten */\n" + text[len(prefix):]
		}
	}
	return "/* @ttsc-rewritten */\n" + text
}
