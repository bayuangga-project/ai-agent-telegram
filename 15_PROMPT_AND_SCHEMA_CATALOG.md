# PROMPT AND OUTPUT SCHEMA CATALOG

This document captures the AI-facing contracts embedded in the current source. Prompts are part of the system behavior and must be versioned/documented when their expected output changes.

## Intent Analyzer Contract
The intent prompt requests strict JSON with at least:
- `intent`
- `complexity`
- `butuhInfoTerkini`
- `jawabanChat`
- reminder fields (`reminderId`, `waktu`, `teks`, `prioritas`, `jenisRecurring`, `recurringConfig`)
- memory fields (`factsBaru`, `profileUpdates`)
- nested specialist objects for diagnosis, docs, audit, audit fix, change detection, roadmap, feature implementation, and self-query.

Supported intent labels are defined in `IntentAnalyzer`; adding an intent requires both schema prompt changes and a `Manager._routeIntent()` path.

## Intent Rules
Important explicit rules embedded in the analyzer include:
- `factsBaru` must represent explicit user-provided facts, not assumptions.
- profile updates capture newly provided personal information.
- real-time web data is required only when `butuhInfoTerkini` is true.
- relative reminder wording such as “tomorrow” is normalized according to the configured Jakarta/WIB date and default reminder time rules.

## Chat Persona
`ChatSpecialist.buildSystemPersona()` incorporates `BOT_PERSONA`: natural Indonesian, aku/kamu, warm, non-template, occasional light humor, and accuracy/honesty over simulated personality. The persona explicitly rejects invented events, stories, or details.

## Diagnostic / Self-Healing Output
Diagnostic prompts ask for diagnosis and patch content. A patch record is stored in `SelfHeal_Patches`. Patch application is subject to `PatchValidator` plus GitHub branching/PR workflow.

## Code Audit Output
Audit parsing expects JSON findings containing fields equivalent to:
- `severity`
- `category`
- `fileName`
- `description`
- `recommendation`

Audit categories include integrity, consistency, robustness, security, performance, dead code, and documentation synchronization depending on audit mode.

## Feature Blueprint
`FeatureArchitect.generateBlueprint()` asks the advanced LLM for a structured implementation blueprint. The project context includes current files, sheets, intents, commands, and roadmap information. Blueprint persistence uses the `SelfHeal_Patches` sheet with a `BLUEPRINT:` marker.

## Self-Awareness Review
`SelfAwareness` asks for five dimensions:
1. Architectural
2. Capability
3. Performance
4. Knowledge
5. Limitation

It may also return an LLM-generated overall score from 1–10. That score is a narrative self-assessment, not an objective benchmark.

## Prompt Change Rules
When changing a structured LLM prompt:
1. update the expected schema in code and docs together;
2. add validation for newly required fields where practical;
3. update specialist routing if a new intent is added;
4. add regression tests using malformed and partial model responses;
5. document whether the model is expected to produce strict JSON, Markdown, prose, or code.
