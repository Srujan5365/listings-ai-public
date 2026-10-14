from abc import ABC, abstractmethod


class IntegrationBase(ABC):
    """All integration services implement this interface for mockability."""

    @abstractmethod
    async def is_connected(self) -> bool: ...

    @abstractmethod
    async def health_check(self) -> dict: ...
