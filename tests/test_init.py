"""Tests for setup, teardown and the frontend card registration."""

from __future__ import annotations

from datetime import timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

import aiohttp
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
)
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.e_vaskeri.const import CARD_URL_PATH, DOMAIN

from .conftest import machines_with_state, mock_api


async def test_setup_and_unload(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """The entry loads and unloads cleanly."""
    assert init_integration.state is ConfigEntryState.LOADED

    await hass.config_entries.async_unload(init_integration.entry_id)
    await hass.async_block_till_done()

    assert init_integration.state is ConfigEntryState.NOT_LOADED


async def test_devices(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """A hub device and one child device per machine are created."""
    registry = dr.async_get(hass)
    hub = registry.async_get_device_by_identifier(
        (DOMAIN, init_integration.entry_id), init_integration.entry_id
    )
    assert hub is not None
    assert hub.name == "Example Laundry"

    dryer = registry.async_get_device_by_identifier(
        (DOMAIN, f"{init_integration.entry_id}_10"), init_integration.entry_id
    )
    assert dryer is not None
    assert dryer.name == "Tørretumbler 10"
    assert dryer.model == "Dryer"
    assert dryer.via_device_id == hub.id
    assert len(dr.async_entries_for_config_entry(registry, init_integration.entry_id)) == 13


async def test_new_machine_added_dynamically(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Machines that show up later get their entities."""
    assert hass.states.get("sensor.vaskemaskine_13_status") is None
    data = machines_with_state(1)
    data["machines"].append(
        {**data["machines"][0], "id": 13, "name": "Vaskemaskine 13", "state": "free"}
    )
    mock_api(aioclient_mock, machines=data)

    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=31))
    await hass.async_block_till_done()

    assert hass.states.get("sensor.vaskemaskine_13_status").state == "free"
    assert hass.states.get("binary_sensor.vaskemaskine_13_in_use").state == "off"


async def test_unavailable_when_api_fails(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Entities become unavailable while the API is unreachable and recover."""
    mock_api(aioclient_mock, exc=aiohttp.ClientError)
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=31))
    await hass.async_block_till_done()

    assert hass.states.get("sensor.vaskemaskine_3_status").state == STATE_UNAVAILABLE
    assert hass.states.get("sensor.example_laundry_machines_overview").state == STATE_UNAVAILABLE

    mock_api(aioclient_mock)
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=62))
    await hass.async_block_till_done()

    assert hass.states.get("sensor.vaskemaskine_3_status").state == "busy"


@pytest.mark.parametrize(
    ("kwargs", "state"),
    [
        ({"exc": aiohttp.ClientError}, ConfigEntryState.SETUP_RETRY),
        ({"status": 401}, ConfigEntryState.SETUP_ERROR),
    ],
)
async def test_setup_failures(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
    kwargs: dict,
    state: ConfigEntryState,
) -> None:
    """Connection errors retry setup; a rejected key starts reauth."""
    mock_api(aioclient_mock, **kwargs)
    mock_config_entry.add_to_hass(hass)

    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert mock_config_entry.state is state
    if state is ConfigEntryState.SETUP_ERROR:
        assert any(hass.config_entries.flow.async_progress_by_handler(DOMAIN))


async def test_card_registered(hass: HomeAssistant, mock_http_and_frontend: MagicMock) -> None:
    """The card is served and added to the frontend when the file exists."""
    with patch("custom_components.e_vaskeri.CARD_FILE", Path(__file__)):
        assert await async_setup_component(hass, DOMAIN, {})

    config = hass.http.async_register_static_paths.call_args.args[0][0]
    assert config.url_path == CARD_URL_PATH
    assert config.path == str(Path(__file__))
    assert config.cache_headers is False
    mock_http_and_frontend.assert_called_once_with(hass, f"{CARD_URL_PATH}?v=1.0.0")


async def test_card_missing_is_not_fatal(
    hass: HomeAssistant,
    mock_http_and_frontend: MagicMock,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """A missing card file only logs a warning."""
    with patch("custom_components.e_vaskeri.CARD_FILE", Path("missing-card.js")):
        assert await async_setup_component(hass, DOMAIN, {})

    assert "Dashboard card" in caplog.text
    hass.http.async_register_static_paths.assert_not_called()
    mock_http_and_frontend.assert_not_called()
