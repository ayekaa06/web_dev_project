from services.model_service import ModelInfoService
models = [
    "gemini",
    "facebook/bart-large",
    "mistralai/Mistral-7B-Instruct-v0.1",
    "google/flan-t5-base",
    "sentence-transformers/all-MiniLM-L6-v2"
]

service = ModelInfoService()

for m in models:
    print(f"\n=== {m} ===")
    data = service.get_model(m)
    print(data)