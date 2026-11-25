Recognize this is a personal toy project, the scope is small, personal, and only relevant to the author. There's no SLA. There are no external commitments to stakeholders, commercial interest, or the general public. Treat it accordingly.

- Use `bun`
- Use `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36` as user-agent when fetching inside agent
- Keep comments to a minimum, for any code comment "why" is fine but never "what"
- Tests live in `src/tests/`, one `<module>.test.ts` per module, never next to the code. Fixtures go in `src/tests/fixtures/`
