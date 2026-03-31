# AI / LLM Integration Security

AI API keys must never appear in client-side code or mobile bundles. All AI calls go through your backend.

Set hard spending caps on every AI provider. Implement per-user usage limits in your application.

Separate user input from system prompts. Treat LLM output as untrusted — sanitize before rendering as HTML, never execute as code without sandboxing, validate all tool call parameters.
