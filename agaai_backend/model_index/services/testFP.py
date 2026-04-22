import json
import time
from services.model_service import ModelInfoService

service = ModelInfoService()

# Список моделей для проверки разных сценариев
test_queries = [
    "google/gemma-2-9b-it",            # Слияние данных (HF + LMSYS)
    "hf:meta-llama/Llama-3.1-8B-it",   # Только HuggingFace (Gated)
    "gpt-4o",                    # Только Arena ELO
    "not-real-model-123",
    "claude-3-5-sonnet-20240620",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "bert-base-uncased"
]

def run_visual_test():
    print("🚀 НАЧАЛО ИНСПЕКЦИИ МОДЕЛЕЙ\n" + "="*50)

    for query in test_queries:
        print(f"\n🔍 ЗАПРОС: '{query}'")
        
        start_time = time.time()
        data = service.get_model(query)
        duration = round(time.time() - start_time, 2)

        # 1. Проверка на наличие данных
        if data and data.get("name") and data.get("name") != query or (data and data.get("source")):
            print(f"✅ Модель найдена ({duration}s)")
            
            # 2. Проверка источников
            sources = data.get("source", [])
            print(f"✅ Источники: {', '.join(sources)}")
            
            # 3. Проверка бенчмарков
            benchmarks = data.get("benchmarks", [])
            if benchmarks:
                print(f"✅ Найдено бенчмарков: {len(benchmarks)}")
            else:
                print("ℹ️  Бенчмарки в README не найдены")

            # ВЫВОД ФИНАЛЬНОГО ОТВЕТА
            print("\n📦 ФИНАЛЬНЫЙ JSON ОБЪЕКТ:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        
        else:
            print(f"❌ Модель не найдена или ошибка ({duration}s)")
        
        print("-" * 50)

    print("\n🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")

if __name__ == "__main__":
    run_visual_test()