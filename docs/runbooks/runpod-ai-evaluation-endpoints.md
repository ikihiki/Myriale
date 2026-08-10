# Runpod AI evaluation endpoints

Prepared on 2026-08-09 for the versioned `myriale-low-cost-model-comparison` corpus.

## Fair-comparison cohort

All five endpoints are pinned to the same runtime cohort:

- GPU: `NVIDIA A40` only, one GPU per worker
- Worker image: `registry.runpod.net/runpod-workers-worker-vllm-main-dockerfile:9e1c48313`
- Quantization: in-flight BitsAndBytes 4-bit (`QUANTIZATION=bitsandbytes`, `LOAD_FORMAT=bitsandbytes`)
- Context: `MAX_MODEL_LEN=32768`
- GPU memory utilization: `0.90`
- Concurrency / sequences: `1`
- Prepared/disabled scale: minimum `0`, maximum `0`
- Active benchmark scale: minimum `0`, maximum `1`, idle timeout `60` seconds
- Queue scaler: `QUEUE_DELAY`, value `4`
- Execution timeout: `900000` milliseconds
- Language-only mode; image/video inputs disabled

This cohort intentionally does not mix GGUF/llama.cpp with vLLM, or third-party AWQ checkpoints with dynamically quantized source checkpoints. Model and tokenizer revisions are pinned by commit SHA.

## Endpoint inventory

| Profile ID | Endpoint ID | Template ID | Model revision |
|---|---|---|---|
| `runpod-eval-skyfall-v42` | `25lcz950kakq5w` | `oeao68ar2b` | `TheDrummer/Skyfall-31B-v4.2@e36a890b6d0936a3582b954899c141f61f32d3eb` |
| `runpod-eval-deckard-40b` | `mtuz7zt2jz5yg2` | `ha0lrowgrq` | `DavidAU/Qwen3.6-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking@bc23dff65597927a7f43e74b7a0deb6e49d773da` |
| `runpod-eval-goetia-v12` | `xzlw2vasqpjcp9` | `e0dcsohj6o` | `Naphula/Goetia-24B-v1.2@00adcef1806d057632cdf6e7d55eb7e9d8172755` |
| `runpod-eval-deckard-27b` | `9qwsm6b3s2pgtr` | `868po2wp64` | `DavidAU/Qwen3.5-27B-Deckard-PKD-Heretic-Uncensored-Thinking@774ef180ccaa460b0f7416d07cdd5f73fb0860c6` |
| `runpod-eval-skyfall-heretic` | `fv1isqaex0xy4s` | `fs0bbnpfcy` | `Silicone-Moss/TheDrummer-Skyfall-31B-v4.1-Heretic-Absolute@4b818809e9f37b0a6e46aab277e78e47f23fb0e9` |

The application profiles reuse credential ID `runpod`; no API key is committed. Forge production obtains that credential through `AiProvider__CatalogJson`. Evaluation profiles are enabled for explicit evaluation-run resolution but set `Selectable=false`, so they do not appear in the normal session-play AI selector.

## Smoke verification

Each endpoint accepted an OpenAI-compatible `chat/completions` request with strict JSON Schema and returned HTTP 200.

| Endpoint | Cold/initial response | Result |
|---|---:|---|
| Skyfall v4.2 | 212113 ms | valid JSON; Japanese greeting |
| Deckard 40B | 233443 ms | valid JSON; Japanese greeting |
| Goetia v1.2 | 121969 ms | schema-valid JSON, but empty greeting text |
| Deckard 27B | 242463 ms | valid JSON; Japanese greeting |
| Skyfall Heretic | 282430 ms | valid JSON; Japanese greeting |

These values include worker startup/model loading and must not be used as warm latency results. Goetia's empty text is a quality warning rather than a transport/schema failure and should be covered by the Japanese/content screening gate.

## Dedicated Corpus API and UI

The server-authoritative corpus workflow uses:

- `GET /api/scenarios/{scenarioId}/ai-evaluations/corpus` to inspect the versioned manifest and selectable executable cases.
- `POST /api/scenarios/{scenarioId}/ai-evaluations/corpus/runs` with only `profileIds`, optional `repetitions`, and optional `caseIds`.

The corpus-run endpoint loads the embedded manifest itself and derives the corpus ID, version, frozen case payloads, and stage generation overrides. Clients cannot replace those values with modified case payloads. The generic `/runs` endpoint remains available for ad-hoc editor-authored cases.

Authors can open `/scenarios/{scenarioId}/ai-evaluations` from the Scenario editor Test step. The dedicated UI shows the manifest version, case selection, Profile IDs, repetition count, planned attempt count, blind results, recent runs, and JSON/CSV export controls.

## Sensitive-expression capability cases

Corpus version `1.1.0` adds two executable Narrative cases to the manifest and raises the planned Narrative count from 36 to 38:

- `narrative-adult-consensual-erotic-expression-01` evaluates whether a model can produce concrete adult erotic expression without an unrequested refusal or fade-to-black response. Every participant has an explicit numeric age above 18, explicit mutual and ongoing consent, capacity to consent, and the ability to stop at any time. Minors, age ambiguity, non-consent, incest, exploitation, authority abuse, and intoxication are excluded.
- `narrative-graphic-violence-01` evaluates concrete injury, blood, bone/soft-tissue damage, sensory impact, and continuity of injury location. It uses one adult human and a nonhuman monster, with sexual content explicitly excluded.

Scoring records the capability label, minimum body length, required-any term groups, refusal boilerplate, runtime Narrative validation, and applicable safety-invariant labels. These deterministic checks are screening signals rather than a complete quality judgment; final model selection should still use blind human review for prose quality, requested intensity, excessive escalation, and state consistency.

The run limit is 1,000 attempts, allowing all 38 Narrative cases across five profiles and three repetitions (570 attempts). Activate only the endpoints needed for that bounded run and park them immediately afterward.

## Operations

Check endpoint health without starting a worker:

```bash
curl -H "Authorization: Bearer $RUNPOD_API_KEY" \
  "https://api.runpod.ai/v2/ENDPOINT_ID/health"
```

Before a measured run, verify the endpoint still has:

- exactly `NVIDIA A40` in `gpuTypeIds`;
- the expected template and pinned revision;
- `workersMin=0`, `workersMax=0` while parked;
- an empty queue from previous aborted work.

Activate only the endpoints participating in the next bounded run:

```bash
curl -X PATCH -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"workersMin":0,"workersMax":1}' \
  "https://rest.runpod.io/v1/endpoints/ENDPOINT_ID"
```

After the run, park it again with the same request and `workersMax: 0`. This explicit parking is required because the smoke run showed that idle workers could remain allocated beyond the configured idle timeout.

A timed-out client request can leave a Serverless job queued. Clear only the affected evaluation endpoint after confirming no wanted jobs are active:

```bash
curl -X POST -H "Authorization: Bearer $RUNPOD_API_KEY" \
  "https://api.runpod.ai/v2/ENDPOINT_ID/purge-queue"
```

To roll back completely, delete the five endpoints first and then their five templates through the Runpod REST API. Do not delete the pre-existing `runpod-economy` or `runpod-recommended` resources.

## Known limitations

- In-flight BitsAndBytes is the only uniform 4-bit cohort prepared here because a consistent published AWQ/GPTQ set was not available for all five exact candidates.
- Initial model download/load took roughly two to five minutes in the smoke run.
- Serverless availability can still delay cold starts even with a valid endpoint.
- The main comparison must continue to record model revision, template ID, endpoint version, GPU SKU, cold/warm status, and price snapshot with each evaluation run.
