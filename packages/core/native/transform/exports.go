package transform

// NewSourceRewrite builds a SourceRewrite from another Go module (e.g. the
// `@nestia/sdk` plugin). SourceRewrite keeps its span fields unexported so
// that the only way to produce one is this constructor or the in-package
// collectors — every rewrite therefore carries a validated [start,end) span.
func NewSourceRewrite(start, end int, replacement string) SourceRewrite {
	return SourceRewrite{
		start:       start,
		end:         end,
		replacement: replacement,
	}
}
