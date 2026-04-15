from .huggingface_parser import HuggingFaceParser
from .lmsys_parser import LMSYSParser

class ModelInfoService:
    def __init__(self):
        self.hf = HuggingFaceParser()
        self.lmsys = LMSYSParser()

    def get_model(self, name: str):
        if name.startswith("hf:"):
            return self.hf.get_model_info(name.replace("hf:", ""))

        if name.startswith("lmsys:"):
            return self.lmsys.get_model_info(name.replace("lmsys:", ""))

        # default
        return self.hf.get_model_info(name)