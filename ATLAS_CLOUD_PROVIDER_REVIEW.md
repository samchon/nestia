# Atlas Cloud Provider Review

## Summary

This change adds a minimal Atlas Cloud provider path to the `nestia` docs and editor examples without introducing runtime changes to core packages.

## What Changed

1. Added an externally hosted `atlascloud.json` example
   - Uses a public raw gist URL instead of embedding the Swagger file in this repository.
   - Models Atlas Cloud's OpenAI-compatible chat completions API with `https://api.atlascloud.ai/v1` as the server URL.
   - Covers request fields used in Atlas docs, including `model`, `messages`, `stream`, `temperature`, `max_tokens`, `top_p`, `top_k`, and `repetition_penalty`.

2. Added `website/src/content/docs/swagger/atlas-cloud.mdx`
   - New provider guide for Atlas Cloud.
   - Documents environment variables, OpenAI SDK usage, streaming usage, and Agentica wiring.
   - Links to the official Atlas Cloud site using the required UTM format.

3. Updated `website/src/content/docs/swagger/_meta.ts`
   - Exposes the new Atlas Cloud guide in the docs navigation.

4. Updated `website/src/constants/EDITOR_EXAMPLES.ts`
   - Adds an Atlas Cloud example so it appears in the cloud editor demo list.

5. Updated `website/.env.example`
   - Documents local environment variables for Atlas Cloud testing and demos.

6. Updated `README.md`
   - Adds a link to the Atlas Cloud provider guide in the Swagger docs section.

## Why This Shape

- `nestia` does not have a first-class provider registry in core packages.
- The closest integration surface in this repository is the Swagger/Agentica/editor workflow.
- A documentation-first provider example plus a real OpenAPI sample is the smallest change that is still directly usable and testable.

## Local Validation Plan

1. Install workspace dependencies.
2. Build the website docs to validate the new MDX page and editor example list.
3. Run a local Atlas Cloud smoke test with:
   - one non-streaming chat completion
   - one streaming chat completion
4. Verify the hosted `atlascloud.json` remains valid enough for the editor/docs build.

## Validation Results

- Website build passed with `npm run build` in `website/`.
- The external `atlascloud.json` raw URL loads correctly for the editor/docs flow.
- Non-streaming Atlas Cloud smoke test passed against `https://api.atlascloud.ai/v1/chat/completions`.
- Streaming Atlas Cloud smoke test passed against `https://api.atlascloud.ai/v1/chat/completions`.
- The verified working model ID for local testing is `deepseek-ai/deepseek-v3.2`.

## Notes

- The Atlas Cloud API key is stored locally only and must not be committed.
- The temporary integration test script is for local verification only and should not be committed.
