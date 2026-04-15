import requests
from .base_parser import BaseParser


class HuggingFaceParser(BaseParser):

    def trim_description(self, text: str, max_len: int = 300):
        if not text:
            return None
        return text[:max_len].strip()
    def fetch_readme(self, model_id: str):
        url = f"https://huggingface.co/{model_id}/raw/main/README.md"
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                return r.text
        except Exception:
            pass
        return None

    # ----------------------------
    # DESCRIPTION PARSER
    # ----------------------------
    def extract_description_from_readme(self, readme: str):
        if not readme:
            return None

        # 1. Лучший вариант — секция "Model description"
        if "## Model description" in readme:
            parts = readme.split("## Model description")
            return parts[1].split("##")[0].strip()

        # 2. fallback — первая норм строка после заголовка
        lines = readme.split("\n")
        for line in lines:
            line = line.strip()
            if line and not line.startswith("#") and line != "---":
                return line

        return None

    # ----------------------------
    # TASK DETECTION
    # ----------------------------
    @staticmethod
    def extract_task(data):
        task = data.get("pipeline_tag")
        if task:
            return task

        tags = data.get("tags", [])
        if "text-generation" in tags:
            return "text-generation"
        if any("text2text" in t for t in tags):
            return "text2text-generation"
        
        if "fill-mask" in tags:
            return "fill-mask"

        return None

    # ----------------------------
    # TAG CLEANING
    # ----------------------------
    @staticmethod
    def clean_tags(tags):
        blacklist = {
            "pytorch", "tf", "jax", "rust",
            "onnx", "safetensors", "region:us"
        }
        return [t for t in tags if not any(b in t for b in blacklist)]

    # ----------------------------
    # MAIN METHOD
    # ----------------------------
    def get_model_info(self, name: str) -> dict:
        url = f"https://huggingface.co/api/models/{name}"

        try:
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                return {}

            data = response.json()

            readme = self.fetch_readme(name)
            description = self.extract_description_from_readme(readme)

            return {
                "name": data.get("modelId"),
                "description": self.trim_description(description) or "No description available",
                "task": self.extract_task(data),
                "tags": self.clean_tags(data.get("tags", [])),
                "downloads": data.get("downloads", 0),
                "likes": data.get("likes", 0),
                "source": ["huggingface"]
            }

        except Exception:
            return {}