# Bright Data evidence capture

This directory holds auditable evidence from the real sponsor-backed Bright Data flow. Do not commit placeholders that could be mistaken for a genuine run.

## Committed artifacts

```text
01-create.json              collector creation
02-run-v1.json              healthy V1 run
03-run-after-change.json    V2 drift survived
04-run-v3-before-heal.json  genuine parse_error failure
05-heal-proposal.json       self-heal preview at the approval gate
06-heal-approved.json       human approval / auto-save
07-run-after-heal.json      same-collector post-heal recovery
MANIFEST.md                 lifecycle metadata and per-file provenance
```

## Provenance tiers

Every artifact must declare which of these it is. `MANIFEST.md` carries the
authoritative table; each file also states its own tier inline.

- **Raw capture** — the CLI's own output file, committed as written, with only
  credential-bearing fields redacted. This is the strongest tier and the goal
  for every artifact.
- **Operator-normalized** — a hand-transcribed record derived from terminal
  output, with the original left on the operator machine. Readable, but the
  chain of custody has a manual link: a reader cannot distinguish a faithful
  transcription from a plausible reconstruction.

A project whose thesis is "do not trust data because it looks valid" should not
rest its own proof on the weaker tier. Treat any operator-normalized artifact as
an open task, not a finished one.

## Capture rules

- Preserve the real production `c_*` Collector ID.
- Preserve timestamps, statuses, target URLs, job/run identifiers, and non-secret request/response metadata needed to correlate the lifecycle.
- Remove or mask API tokens, authorization headers, cookies, session material, and unrelated personal data.
- Redact by replacing a secret's *value*, keeping the key, so a reader can see what was removed.
- Do not rewrite failing output to make it look successful.
- Do not normalize captured output to remove a cosmetic inconsistency. If two
  artifacts disagree, explain the disagreement in `MANIFEST.md` instead of
  editing either file.
- Keep the V1 run, failing run, heal proposal/approval, and post-heal run as separate artifacts.
- Record the exact repository commit SHA used for the demo in `MANIFEST.md`.

## Upgrading an artifact from normalized to raw

1. Locate the original CLI output on the operator machine (the per-file
   `capture_note` records the local filename).
2. Redact only credential-bearing values; change nothing else — not key order,
   not formatting, not a stray field.
3. Overwrite the artifact and set its tier to `raw capture` in `MANIFEST.md`.
4. Confirm the `response_id` and collector ID still match what the manifest
   claims, so the lifecycle stays correlatable.
5. If the original is unrecoverable, say so in `MANIFEST.md`. An acknowledged
   gap is evidence; a silent upgrade is not.

## Minimum proof sequence

1. create/publish the custom Browser Worker;
2. run V1 and capture the healthy result;
3. change the public target layout/semantics without changing the Collector ID;
4. run again and capture the semantic failure;
5. request self-heal and capture the preview/diff;
6. verify the preview through WebReceipt's Deal Contract gate;
7. approve/autosave only if valid;
8. rerun the same Collector ID and capture the healthy post-heal result.

Never add fabricated output just to make the directory look complete.
