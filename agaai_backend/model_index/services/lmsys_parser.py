import requests
from .base_parser import BaseParser

class LMSYSParser(BaseParser):

    def get_model_info(self, name: str) -> dict:
        return {
            "name": name,
            "description": "LMSYS parser not implemented yet",
            "task": None,
            "tags": [],
            "downloads": 0,
            "likes": 0,
            "source": ["lmsys"]
        }