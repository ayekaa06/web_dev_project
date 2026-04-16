from services.model_service import ModelInfoService
import time
import json

service = ModelInfoService()

models = [
    "openai-community/gpt2",
    "facebook/bart-large",
    "google/flan-t5-base",
    "mistralai/Mistral-7B-Instruct-v0.1",
    "sentence-transformers/all-MiniLM-L6-v2",
    "bert-base-uncased",
    "distilbert-base-uncased",
    "tiiuae/falcon-7b",
    "bigscience/bloom-560m"
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