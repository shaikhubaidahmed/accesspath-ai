#!/usr/bin/env python3
"""Fine-tune and evaluate a small open-weight accessibility-note extractor on Tinker."""

from __future__ import annotations

import asyncio
import json
import os
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path
from time import perf_counter

import numpy as np
import tinker
from tinker_cookbook.renderers import TrainOnWhat, get_renderer, get_text_content
from tinker_cookbook.supervised.data import conversation_to_datum

ROOT = Path(__file__).resolve().parents[1]
MODEL = "Qwen/Qwen3.5-4B"


def load_examples():
    rows = [json.loads(line) for line in (ROOT / "training/accessibility_examples.jsonl").read_text().splitlines()]
    return [row for row in rows if row["split"] == "train"], [row for row in rows if row["split"] == "eval"]


def parse_json(text: str):
    try:
        start, end = text.index("{"), text.rindex("}") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        return None


async def evaluate(sampler, renderer, examples):
    params = tinker.SamplingParams(max_tokens=120, temperature=0, stop=renderer.get_stop_sequences())
    exact = 0
    field_hits = 0
    field_total = 0
    outputs = []
    for row in examples:
        prompt = renderer.build_generation_prompt(row["messages"][:2])
        result = await sampler.sample_async(prompt=prompt, num_samples=1, sampling_params=params)
        response, _ = renderer.parse_response(result.sequences[0].tokens)
        text = get_text_content(response)
        actual = parse_json(text)
        expected = json.loads(row["messages"][2]["content"])
        exact += int(actual == expected)
        if actual:
            field_hits += sum(actual.get(key) == value for key, value in expected.items())
        field_total += len(expected)
        outputs.append({"note": row["messages"][1]["content"], "expected": expected, "actual": actual})
    return {
        "exactMatch": exact / len(examples),
        "fieldAccuracy": field_hits / field_total,
        "outputs": outputs,
    }


async def main():
    if not os.getenv("TINKER_API_KEY"):
        raise SystemExit("Set TINKER_API_KEY before starting a paid Tinker training run.")
    train_rows, eval_rows = load_examples()
    run_stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    service = tinker.ServiceClient(user_metadata={"project": "accesspath", "task": "accessibility-constraint-extraction"})
    client = await service.create_lora_training_client_async(base_model=MODEL, rank=16)
    run_info = await client.get_info_async()
    renderer = get_renderer("qwen3_5", client.get_tokenizer())
    train_data = [
        conversation_to_datum(row["messages"], renderer, max_length=384, train_on_what=TrainOnWhat.LAST_ASSISTANT_MESSAGE)
        for row in train_rows
    ]

    baseline_future = await client.save_weights_for_sampler_async(
        name=f"accesspath-baseline-{run_stamp}",
        user_metadata={"project": "accesspath", "stage": "baseline"},
    )
    baseline_checkpoint = await baseline_future.result_async()
    baseline_sampler = await service.create_sampling_client_async(model_path=baseline_checkpoint.path)
    baseline = await evaluate(baseline_sampler, renderer, eval_rows)
    losses = []
    started = perf_counter()
    for step in range(12):
        forward = await client.forward_backward_async(train_data, "cross_entropy")
        update = await client.optim_step_async(tinker.AdamParams(learning_rate=0.0002))
        result = await forward.result_async()
        await update.result_async()
        logprobs = np.concatenate([output["logprobs"].tolist() for output in result.loss_fn_outputs])
        weights = np.concatenate([datum.loss_fn_inputs["weights"].tolist() for datum in train_data])
        loss = float(-np.dot(logprobs, weights) / weights.sum())
        losses.append(loss)
        print(f"step={step:02d} loss={loss:.4f}")

    tuned_future = await client.save_weights_for_sampler_async(
        name=f"accesspath-fine-tuned-{run_stamp}",
        user_metadata={"project": "accesspath", "stage": "fine-tuned"},
    )
    tuned_checkpoint = await tuned_future.result_async()
    tuned_sampler = await service.create_sampling_client_async(model_path=tuned_checkpoint.path)
    tuned = await evaluate(tuned_sampler, renderer, eval_rows)
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "model": MODEL,
        "modelId": run_info.model_id,
        "method": "Tinker LoRA SFT",
        "rank": 16,
        "steps": len(losses),
        "examples": {"train": len(train_rows), "eval": len(eval_rows)},
        "checkpoints": {
            "baseline": baseline_checkpoint.path,
            "fineTuned": tuned_checkpoint.path,
        },
        "dependencies": {
            "numpy": version("numpy"),
            "tinker": version("tinker"),
            "tinkerCookbook": version("tinker-cookbook"),
        },
        "seconds": round(perf_counter() - started, 2),
        "loss": {"first": losses[0], "last": losses[-1], "curve": losses},
        "baseline": baseline,
        "fineTuned": tuned,
    }
    output = ROOT / "training/reports/tinker-evaluation.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2))
    print(json.dumps({key: report[key] for key in ("model", "loss", "baseline", "fineTuned")}, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
