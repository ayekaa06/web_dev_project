from abc import ABC, abstractmethod

class BaseParser(ABC):

    @abstractmethod
    def get_model_info(self, name: str) -> dict:
        pass