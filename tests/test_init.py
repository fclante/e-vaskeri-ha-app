"""Tests for setup, teardown and the frontend card registration."""

from __future__ import annotations

import asyncio
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
    async_capture_events,
    async_fire_time_changed,
)
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.e_vaskeri.const import CARD_URL_PATH, DOMAIN, EVENT_CYCLE_FINISHED

from .conftest import SCHEDULE_ENTITY_ID, machines_with_state, mock_api


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
        ({"status": 403}, ConfigEntryState.SETUP_ERROR),
    ],
)
async def test_setup_failures(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
    kwargs: dict,
    state: ConfigEntryState,
) -> None:
    """Connection errors retry setup; denied access starts key-free recovery."""
    mock_api(aioclient_mock, **kwargs)
    mock_config_entry.add_to_hass(hass)

    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert mock_config_entry.state is state
    if state is ConfigEntryState.SETUP_ERROR:
        flow = hass.config_entries.flow.async_progress_by_handler(DOMAIN)[0]
        result = await hass.config_entries.flow.async_configure(flow["flow_id"])
        assert result["step_id"] == "reauth_confirm"
        assert not result["data_schema"].schema


async def test_legacy_api_key_is_unused(
    hass: HomeAssistant,
    legacy_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Old saved keys are preserved but never sent during setup or either polling stream."""
    original_data = dict(legacy_config_entry.data)
    mock_api(aioclient_mock)
    await hass.config_entries.async_setup(legacy_config_entry.entry_id)
    await hass.async_block_till_done()
    assert legacy_config_entry.state is ConfigEntryState.LOADED
    assert len(aioclient_mock.mock_calls) == 8
    assert all("X-API-Key" not in (call[3] or {}) for call in aioclient_mock.mock_calls)

    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=601))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 16
    assert all("X-API-Key" not in (call[3] or {}) for call in aioclient_mock.mock_calls)
    assert dict(legacy_config_entry.data) == original_data


async def test_card_registered(hass: HomeAssistant, mock_http_and_frontend: MagicMock) -> None:
    """The card is served and added to the frontend when the file exists."""
    with patch("custom_components.e_vaskeri.CARD_FILE", Path(__file__)):
        assert await async_setup_component(hass, DOMAIN, {})

    config = hass.http.async_register_static_paths.call_args.args[0][0]
    assert config.url_path == CARD_URL_PATH
    assert config.path == str(Path(__file__))
    assert config.cache_headers is False
    mock_http_and_frontend.assert_called_once_with(hass, f"{CARD_URL_PATH}?v=1.1.0")


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


@pytest.mark.parametrize("schedule_state", ["off", None, "unknown", "unavailable"])
async def test_closed_schedule_pauses_requests(
    hass: HomeAssistant,
    scheduled_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
    caplog: pytest.LogCaptureFixture,
    schedule_state: str | None,
) -> None:
    """Initial data is loaded but timers and manual updates never fetch while paused."""
    assert scheduled_integration.state is ConfigEntryState.LOADED
    assert len(aioclient_mock.mock_calls) == 8
    runtime = scheduled_integration.runtime_data
    machines, account = runtime.machines.data, runtime.account.data
    state = hass.states.get("sensor.example_laundry_machines_overview")
    assert state.state != STATE_UNAVAILABLE

    for seconds in (601, 1202):
        async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=seconds))
        await hass.async_block_till_done(wait_background_tasks=True)
    for coordinator in (runtime.machines, runtime.account):
        await coordinator.async_refresh()
        await coordinator.async_request_refresh()
    await hass.async_block_till_done(wait_background_tasks=True)

    assert len(aioclient_mock.mock_calls) == 8
    assert runtime.machines.data is machines
    assert runtime.account.data is account
    assert hass.states.get(state.entity_id) is state
    warnings = [
        record
        for phase in ("setup", "call")
        for record in caplog.get_records(phase)
        if "polling is paused" in record.message
    ]
    assert len(warnings) == (0 if schedule_state == "off" else 1)

    hass.states.async_set(SCHEDULE_ENTITY_ID, "on")
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 16
    assert runtime.machines.update_interval.total_seconds() == 30
    assert runtime.account.update_interval.total_seconds() == 600


async def test_schedule_transitions_and_polling(
    hass: HomeAssistant,
    scheduled_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Opening refreshes once, then both streams resume their usual intervals."""
    assert len(aioclient_mock.mock_calls) == 8
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=31))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 9

    hass.states.async_set(SCHEDULE_ENTITY_ID, "off")
    await hass.async_block_till_done()
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=1202))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 9

    hass.states.async_set(SCHEDULE_ENTITY_ID, "on")
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 17
    hass.states.async_set(SCHEDULE_ENTITY_ID, "on", {"next_event": "changed"})
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 17

    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=31))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 18
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=601))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 26


async def test_schedule_unload_and_reload(
    hass: HomeAssistant,
    scheduled_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Reloads leave one listener per entry and unloading removes it entirely."""
    await hass.config_entries.async_reload(scheduled_integration.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 16
    hass.states.async_set(SCHEDULE_ENTITY_ID, "off")
    await hass.async_block_till_done()
    hass.states.async_set(SCHEDULE_ENTITY_ID, "on")
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 24

    await hass.config_entries.async_unload(scheduled_integration.entry_id)
    hass.states.async_set(SCHEDULE_ENTITY_ID, "off")
    await hass.async_block_till_done()
    hass.states.async_set(SCHEDULE_ENTITY_ID, "on")
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=1202))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 24


async def test_schedule_becomes_unavailable(
    hass: HomeAssistant,
    scheduled_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """A missing helper pauses polling, warns once and recovers when recreated."""
    hass.states.async_remove(SCHEDULE_ENTITY_ID)
    await hass.async_block_till_done()
    hass.states.async_set(SCHEDULE_ENTITY_ID, "unavailable")
    await hass.async_block_till_done()
    hass.states.async_set(SCHEDULE_ENTITY_ID, "unknown")
    await hass.async_block_till_done()
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=1202))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 8
    assert caplog.text.count("polling is paused") == 1

    hass.states.async_set(SCHEDULE_ENTITY_ID, "on")
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == 16


async def test_schedule_respects_disabled_polling(
    hass: HomeAssistant,
    scheduled_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Schedule opening must not bypass HA's disabled-polling preference."""
    hass.config_entries.async_update_entry(scheduled_integration, pref_disable_polling=True)
    await hass.async_block_till_done()
    count = len(aioclient_mock.mock_calls)
    hass.states.async_set(SCHEDULE_ENTITY_ID, "off")
    await hass.async_block_till_done()
    hass.states.async_set(SCHEDULE_ENTITY_ID, "on")
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=1202))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert len(aioclient_mock.mock_calls) == count


async def test_closed_schedule_preserves_api_failure(
    hass: HomeAssistant,
    scheduled_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Skipping a request must not turn a failed update into a successful one."""
    coordinator = scheduled_integration.runtime_data.machines
    mock_api(aioclient_mock, exc=aiohttp.ClientError)
    await coordinator.async_refresh()
    assert not coordinator.last_update_success
    hass.states.async_set(SCHEDULE_ENTITY_ID, "off")
    await hass.async_block_till_done()
    await coordinator.async_refresh()
    assert not coordinator.last_update_success
    assert len(aioclient_mock.mock_calls) == 1
    assert hass.states.get("sensor.vaskemaskine_3_status").state == STATE_UNAVAILABLE


async def test_queued_refresh_respects_closing(
    hass: HomeAssistant,
    scheduled_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """An in-flight fetch may finish but a refresh waiting on its lock must not fetch."""
    coordinator = scheduled_integration.runtime_data.machines
    started, release = asyncio.Event(), asyncio.Event()
    original_fetch = coordinator.client.async_get_machines

    async def delayed_fetch() -> dict:
        data = await original_fetch()
        started.set()
        await release.wait()
        return data

    with patch.object(coordinator.client, "async_get_machines", side_effect=delayed_fetch):
        active = scheduled_integration.async_create_background_task(
            hass, coordinator.async_refresh(), "in-flight refresh"
        )
        await started.wait()
        queued = scheduled_integration.async_create_background_task(
            hass, coordinator.async_refresh(), "queued refresh"
        )
        hass.states.async_set(SCHEDULE_ENTITY_ID, "off")
        await hass.async_block_till_done()
        release.set()
        await asyncio.gather(active, queued)

    assert len(aioclient_mock.mock_calls) == 9
    assert coordinator.update_interval is None


async def test_in_flight_fetch_is_not_reopening_baseline(
    hass: HomeAssistant,
    scheduled_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Pre-closing data arriving after reopening must not enable delayed cycle events."""
    coordinator = scheduled_integration.runtime_data.machines
    events = async_capture_events(hass, EVENT_CYCLE_FINISHED)
    started, release = asyncio.Event(), asyncio.Event()
    original_fetch = coordinator.client.async_get_machines

    async def delayed_fetch() -> dict:
        data = await original_fetch()
        started.set()
        await release.wait()
        return data

    with patch.object(coordinator.client, "async_get_machines", side_effect=delayed_fetch):
        active = scheduled_integration.async_create_background_task(
            hass, coordinator.async_refresh(), "in-flight refresh"
        )
        await started.wait()
        hass.states.async_set(SCHEDULE_ENTITY_ID, "off")
        await hass.async_block_till_done()
        mock_api(aioclient_mock, machines=machines_with_state(3, state="free"))
        hass.states.async_set(SCHEDULE_ENTITY_ID, "on")
        await hass.async_block_till_done()
        release.set()
        await active
        await hass.async_block_till_done(wait_background_tasks=True)

    assert events == []
    assert hass.states.get("sensor.vaskemaskine_3_status").state == "free"
