"""Async client for the E-Vaskeri REST API."""

from __future__ import annotations

import asyncio
from http import HTTPStatus
from typing import Any

import aiohttp

from .const import REQUEST_TIMEOUT


class EVaskeriError(Exception):
    """Base error for the E-Vaskeri API client."""


class EVaskeriConnectionError(EVaskeriError):
    """The API could not be reached or returned an unexpected response."""


class EVaskeriAuthError(EVaskeriError):
    """The API rejected the supplied API key."""


class EVaskeriClient:
    """Thin wrapper around the E-Vaskeri API."""

    def __init__(
        self,
        session: aiohttp.ClientSession,
        base_url: str,
        api_key: str | None = None,
    ) -> None:
        """Initialize the client."""
        self._session = session
        self._base_url = base_url.rstrip("/")
        self._headers = {"X-API-Key": api_key} if api_key else {}

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        try:
            async with asyncio.timeout(REQUEST_TIMEOUT):
                response = await self._session.get(
                    f"{self._base_url}{path}", headers=self._headers, params=params
                )
                async with response:
                    if response.status in (HTTPStatus.UNAUTHORIZED, HTTPStatus.FORBIDDEN):
                        raise EVaskeriAuthError(f"Authentication failed ({response.status})")
                    response.raise_for_status()
                    return await response.json()
        except EVaskeriError:
            raise
        except TimeoutError as err:
            raise EVaskeriConnectionError("Timeout talking to the API") from err
        except (aiohttp.ClientError, ValueError) as err:
            raise EVaskeriConnectionError(f"Error talking to the API: {err}") from err

    async def async_health(self) -> None:
        """Check that the API is alive."""
        await self._get("/health")

    async def async_get_machines(self) -> dict[str, Any]:
        """Return machines, summary and location."""
        return await self._get("/api/v1/machines")

    async def async_get_balance(self) -> dict[str, Any]:
        """Return the account balance."""
        return await self._get("/api/v1/balance")

    async def async_get_statement(self, limit: int) -> dict[str, Any]:
        """Return the latest statement entries."""
        return await self._get("/api/v1/statement", {"limit": limit})

    async def async_get_stats(self, months: int) -> dict[str, Any]:
        """Return usage statistics."""
        return await self._get("/api/v1/stats", {"months": months})

    async def async_get_periods(self, limit: int) -> dict[str, Any]:
        """Return the latest billing periods."""
        return await self._get("/api/v1/periods", {"limit": limit})

    async def async_get_calendar(self) -> dict[str, Any]:
        """Return booking availability."""
        return await self._get("/api/v1/calendar")

    async def async_get_prices(self) -> dict[str, Any]:
        """Return the price list."""
        return await self._get("/api/v1/prices")

    async def async_get_messages(self, limit: int) -> dict[str, Any]:
        """Return the latest landlord messages."""
        return await self._get("/api/v1/messages", {"limit": limit})
