# Task for sdd-spec

Write the SDD spec for the change: **github-actions-ci**

## Active Change
- **Name**: github-actions-ci
- **Type**: DevOps / Infrastructure
- **Artifact store**: openspec
- **Output path**: openspec/github-actions-ci/spec.md
- **Project root**: /mnt/c/Users/juanc/Desktop/dreamhouse/back-office

## Proposal (already approved)
Located at: openspec/github-actions-ci/proposal.md

Summary:
- Configure a GitHub Actions CI pipeline that runs `lint` and `build` on every push and PR
- Pre-condition: fix 8 existing `no-explicit-any` lint errors across 6 files before the pipeline activates
- Trigger: push to all branches + PR to main
- Lint: warn only (continue-on-error: true)
- Build: uses real GitHub Secrets
- Node: 22
- Badge in README: yes

## Files with known lint errors (confirm exact lines by reading them)
- app/api/event/route.ts — lines 38, 90
- app/api/inquiries/diag-airbnb/route.ts — line 27
- app/api/test-calendar/route.ts — line 8
- app/api/test-db/route.ts — lines TBD (read and confirm)
- app/lib/repository/booking/booking.repository.ts — line 21
- app/lib/services/calendar.service.ts — lines 124, 207, 246

## Spec requirements
1. Read each file with a known lint error and confirm the exact lines, types, and context (what the `any` represents — is it a real type or a quick debug route?)
2. For each `any`, specify the correct fix: proper type, `unknown` + narrowing, or justified `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with reason.
3. Read `next.config.ts` (or `next.config.js`) to check whether any env vars are used at build time (would cause CI build failure if secret is missing).
4. Write FR (Functional Requirements) and scenarios covering:
   - FR-1: CI trigger (push + PR conditions)
   - FR-2: Lint job requirements
   - FR-3: Build job requirements (env, secrets, dependency on lint)
   - FR-4: Lint baseline cleanup — one sub-requirement per file
   - FR-5: Badge in README
   - FR-6: GOOGLE_PRIVATE_KEY multiline handling
5. Include edge cases: what happens if lint fails (build must still run), build-time env var gaps.
6. Output the spec to openspec/github-actions-ci/spec.md

## Output format (Result Contract)
Return:
- status: success | partial | failed
- executive_summary: 2-3 sentences
- artifacts: [{ path, description }]
- next_recommended: sdd-design
- risks: list
- skill_resolution: paths-injected | none

## Acceptance Contract
Acceptance level: checked
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope

Required evidence: changed-files, tests-added, commands-run, residual-risks, no-staged-files

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```