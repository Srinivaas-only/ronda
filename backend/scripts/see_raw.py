"""See the raw, unparsed GLM response — no JSON validation."""
import os
import json
from pathlib import Path
from dotenv import load_dotenv
import anthropic

load_dotenv(Path(__file__).parent.parent / ".env")

client = anthropic.Anthropic(
    api_key=os.getenv("ILMU_API_KEY") or os.getenv("ANTHROPIC_AUTH_TOKEN"),
    base_url=os.getenv("ILMU_BASE_URL", "https://api.ilmu.ai/anthropic"),
    timeout=60.0,
)

print("Calling ilmu-glm-5.1 with a tiny JSON test...\n")

resp = client.messages.create(
    model="ilmu-glm-5.1",
    max_tokens=500,
    temperature=0.3,
    system="You output JSON only. No prose, no markdown, no thinking tags.",
    messages=[{
        "role": "user",
        "content": 'Return JSON: {"status": "ok", "msg": "hello from ilmu-glm-5.1"}'
    }],
)

print(f"Stop reason: {resp.stop_reason}")
print(f"Usage: in={resp.usage.input_tokens} out={resp.usage.output_tokens}")
print(f"\nNumber of content blocks: {len(resp.content)}")
print("\n--- Content blocks ---")
for i, block in enumerate(resp.content):
    block_type = getattr(block, "type", "UNKNOWN")
    print(f"\n[Block {i}] type={block_type!r}")
    print(f"  raw block: {block}")
    if hasattr(block, "text"):
        text = block.text
        print(f"  text length: {len(text)}")
        print(f"  text repr: {text!r}")
        print(f"  first 200 chars: {text[:200]}")

print("\n--- Full response object (JSON) ---")
print(json.dumps(resp.model_dump(), indent=2, default=str)[:2000])