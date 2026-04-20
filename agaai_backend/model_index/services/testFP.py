from services.model_service import ModelInfoService
import time
import json

service = ModelInfoService()

models = [
    "meta-llama/Llama-3.1-70B-Instruct",
    "meta-llama/Llama-3.1-8B-Instruct",
    "Qwen/Qwen2.5-72B-Instruct",
    "Qwen/Qwen2.5-7B-Instruct",
    "mistralai/Mistral-Large-Instruct-2407",
    "mistralai/Mixtral-8x22B-Instruct-v0.1",
    "mistralai/Mistral-Small-24B-Instruct-2501",
    "google/gemma-2-27b-it",
    "google/gemma-2-9b-it",
    "tiiuae/falcon-180B-chat"
]
DELAY = 0.2  # чуть больше чтобы не сразу словить limit

success = 0
errors = 0

print("🚀 Testing multiple models...\n")

for i, model in enumerate(models):
    print(f"\n=== {model} ===")

    start = time.time()

    try:
        data = service.get_model(model)
        duration = round(time.time() - start, 3)

        if not data:
            print(f"❌ EMPTY ({duration}s)")
            errors += 1

        elif "error" in data:
            print(f"⚠️ {data['error']} ({duration}s)")
            errors += 1

        else:
            print(f"✅ OK ({duration}s)")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            success += 1

    except Exception as e:
        print(f"💥 EXCEPTION: {e}")
        errors += 1

    time.sleep(DELAY)

print("\n📊 RESULT:")
print(f"✅ Success: {success}")
print(f"❌ Errors: {errors}")