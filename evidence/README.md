# Bright Data evidence capture

This directory is reserved for auditable evidence from the real sponsor-backed Bright Data flow. Do not commit placeholders that could be mistaken for a genuine run.

## Expected artifacts

Use timestamped, token-masked files such as:

```text
01-create.json
02-run-v1.json
03-run-after-change.json
04-heal-proposal.json
05-run-v2.json
```

The final filenames may differ if the Bright Data CLI/API returns another natural grouping, but the evidence should make the same lifecycle independently inspectable.

## Capture rules

- Preserve the real production `c_*` Collector ID.
- Preserve timestamps, statuses, target URLs, job/run identifiers, and non-secret request/response metadata needed to correlate the lifecycle.
- Remove or mask API tokens, authorization headers, cookies, session material, and unrelated personal data.
- Do not rewrite failing output to make it look successful.
- Keep the V1 run, failing run, heal proposal/approval, and post-heal run as separate artifacts.
- Record the exact repository commit SHA used for the demo in a short `MANIFEST.md` when evidence is added.

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
