"""Fixtures for the E-Vaskeri tests."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

from homeassistant.const import CONF_API_KEY, CONF_URL
from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, mock_component
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.e_vaskeri.const import CONF_OPENING_HOURS, DOMAIN

BASE_URL = "http://e-vaskeri.test:5000"
SAMPLE_DIR = Path(__file__).parent.parent / "sample_data"
SCHEDULE_ENTITY_ID = "schedule.laundry"


def load_sample(name: str) -> dict[str, Any]:
    """Load a sample API response."""
    return json.loads((SAMPLE_DIR / f"{name}.json").read_text(encoding="utf-8"))


def mock_api(
    aioclient_mock: AiohttpClientMocker,
    *,
    machines: dict[str, Any] | None = None,
    statement: dict[str, Any] | None = None,
    extras: dict[str, Any] | None = None,
    legacy_api: bool = False,
    status: int = 200,
    exc: type[Exception] | None = None,
) -> None:
    """Register the sample API on the client mocker, replacing earlier mocks.

    `extras` overrides the optional endpoints by name, `legacy_api` makes them answer 404 like
    an API version that does not have them.
    """
    aioclient_mock.clear_requests()
    responses = {
        "/health": {"status": "ok"},
        "/api/v1/machines": machines or load_sample("machines"),
        "/api/v1/balance": load_sample("balance"),
        "/api/v1/statement": statement or load_sample("statement"),
        "/api/v1/stats": load_sample("stats"),
    }
    for path, body in responses.items():
        if exc is not None:
            aioclient_mock.get(f"{BASE_URL}{path}", exc=exc)
        else:
            aioclient_mock.get(f"{BASE_URL}{path}", json=body, status=status)
    for name in ("periods", "calendar", "prices", "messages"):
        path = f"{BASE_URL}/api/v1/{name}"
        if exc is not None:
            aioclient_mock.get(path, exc=exc)
        elif legacy_api:
            aioclient_mock.get(path, json={"message": "Not found"}, status=404)
        else:
            sample = (extras or {}).get(name) or load_sample(name)
            aioclient_mock.get(path, json=sample, status=status)


def machines_with_state(machine_id: int, **changes: Any) -> dict[str, Any]:
    """Return the sample machines with one machine modified."""
    data = copy.deepcopy(load_sample("machines"))
    for machine in data["machines"]:
        if machine["id"] == machine_id:
            machine.update(changes)
    return data


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Enable loading of the custom integration."""


@pytest.fixture(autouse=True)
def mock_http_and_frontend(hass: HomeAssistant) -> Any:
    """Provide http/frontend stand-ins so their heavy setup is skipped."""
    mock_component(hass, "http")
    mock_component(hass, "frontend")
    hass.http = MagicMock(async_register_static_paths=AsyncMock())
    with patch("custom_components.e_vaskeri.frontend.add_extra_js_url") as add_url:
        yield add_url


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    """Return a config entry for the sample API."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Example Laundry",
        unique_id=BASE_URL,
        data={CONF_URL: BASE_URL, CONF_API_KEY: None},
    )


@pytest.fixture
async def init_integration(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> MockConfigEntry:
    """Set up the integration against the sample API."""
    mock_api(aioclient_mock)
    mock_config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    return mock_config_entry


@pytest.fixture
def schedule_state() -> str | None:
    """Default to an open laundry."""
    return "on"


@pytest.fixture
async def scheduled_integration(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
    schedule_state: str | None,
) -> MockConfigEntry:
    """Set up an entry with an opening-hours helper."""
    if schedule_state is not None:
        hass.states.async_set(SCHEDULE_ENTITY_ID, schedule_state)
    mock_config_entry.add_to_hass(hass)
    hass.config_entries.async_update_entry(
        mock_config_entry, options={CONF_OPENING_HOURS: SCHEDULE_ENTITY_ID}
    )
    mock_api(aioclient_mock)
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    return mock_config_entry
