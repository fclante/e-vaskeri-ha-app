"""Tests for the E-Vaskeri config and options flows."""

from __future__ import annotations

import aiohttp
from homeassistant.config_entries import SOURCE_REAUTH, SOURCE_RECONFIGURE, SOURCE_USER
from homeassistant.const import CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.e_vaskeri.const import (
    CONF_ACCOUNT_INTERVAL,
    CONF_MACHINES_INTERVAL,
    CONF_OPENING_HOURS,
    DOMAIN,
)

from .conftest import BASE_URL, SCHEDULE_ENTITY_ID, mock_api


async def test_user_flow_success(hass: HomeAssistant, aioclient_mock: AiohttpClientMocker) -> None:
    """A valid URL creates an entry titled after the location."""
    mock_api(aioclient_mock)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    assert set(result["data_schema"].schema) == {CONF_URL}

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: f"{BASE_URL}/ "}
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Example Laundry"
    assert result["data"] == {CONF_URL: BASE_URL}
    assert result["result"].unique_id == BASE_URL
    assert all("X-API-Key" not in (call[3] or {}) for call in aioclient_mock.mock_calls)


@pytest.mark.parametrize(
    ("kwargs", "error"),
    [
        ({"exc": aiohttp.ClientError}, "cannot_connect"),
        ({"status": 500}, "cannot_connect"),
        ({"exc": TimeoutError}, "cannot_connect"),
        ({"status": 401}, "invalid_auth"),
        ({"status": 403}, "invalid_auth"),
        ({"exc": RuntimeError}, "unknown"),
    ],
)
async def test_user_flow_errors_then_recovery(
    hass: HomeAssistant,
    aioclient_mock: AiohttpClientMocker,
    kwargs: dict,
    error: str,
) -> None:
    """Errors are reported and the flow can be completed afterwards."""
    mock_api(aioclient_mock, **kwargs)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_URL: BASE_URL})
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": error}

    mock_api(aioclient_mock)
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_URL: BASE_URL})
    assert result["type"] is FlowResultType.CREATE_ENTRY


async def test_user_flow_invalid_url(hass: HomeAssistant) -> None:
    """A URL without host is rejected before any request."""
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_URL: "ftp://"})
    assert result["errors"] == {"base": "invalid_url"}


async def test_user_flow_duplicate(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """The same normalized URL cannot be configured twice."""
    mock_api(aioclient_mock)
    mock_config_entry.add_to_hass(hass)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: BASE_URL.upper().replace("HTTP", "http") + "/"}
    )
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


@pytest.mark.parametrize("status", [401, 403])
async def test_reauth_flow(
    hass: HomeAssistant,
    legacy_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
    status: int,
) -> None:
    """Denied access can be retried without asking for or modifying a legacy key."""
    original_data = dict(legacy_config_entry.data)
    mock_api(aioclient_mock, status=status)
    result = await legacy_config_entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"
    assert not result["data_schema"].schema
    assert hass.config_entries.flow.async_progress()[0]["context"]["source"] == SOURCE_REAUTH

    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "invalid_auth"}
    assert dict(legacy_config_entry.data) == original_data
    assert all("X-API-Key" not in (call[3] or {}) for call in aioclient_mock.mock_calls)

    mock_api(aioclient_mock)
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_successful"
    assert dict(legacy_config_entry.data) == original_data
    assert all("X-API-Key" not in (call[3] or {}) for call in aioclient_mock.mock_calls)


async def test_reconfigure_flow(
    hass: HomeAssistant,
    legacy_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """URL-only reconfiguration preserves legacy data and polling options."""
    new_url = f"{BASE_URL}/api-proxy"
    mock_api(aioclient_mock, base_url=new_url)
    options = {
        CONF_MACHINES_INTERVAL: 15,
        CONF_ACCOUNT_INTERVAL: 120,
        CONF_OPENING_HOURS: SCHEDULE_ENTITY_ID,
    }
    hass.config_entries.async_update_entry(legacy_config_entry, options=options)
    original_data = dict(legacy_config_entry.data)
    result = await legacy_config_entry.start_reconfigure_flow(hass)
    assert result["step_id"] == SOURCE_RECONFIGURE
    assert set(result["data_schema"].schema) == {CONF_URL}

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: f"{new_url}/"}
    )
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert dict(legacy_config_entry.data) == {**original_data, CONF_URL: new_url}
    assert legacy_config_entry.unique_id == new_url
    assert legacy_config_entry.options == options
    assert all("X-API-Key" not in (call[3] or {}) for call in aioclient_mock.mock_calls)


async def test_options_flow(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """Polling intervals are stored as integers and applied on reload."""
    coordinator = init_integration.runtime_data.machines
    assert coordinator.update_interval.total_seconds() == 30

    result = await hass.config_entries.options.async_init(init_integration.entry_id)
    assert result["type"] is FlowResultType.FORM

    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {CONF_MACHINES_INTERVAL: 15.0, CONF_ACCOUNT_INTERVAL: 120.0},
    )
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert init_integration.options == {CONF_MACHINES_INTERVAL: 15, CONF_ACCOUNT_INTERVAL: 120}
    runtime_data = init_integration.runtime_data
    assert runtime_data.machines.update_interval.total_seconds() == 15
    assert runtime_data.account.update_interval.total_seconds() == 120


async def test_opening_hours_options(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    """A schedule can be selected, changed and cleared without converting its ID to int."""
    hass.states.async_set(SCHEDULE_ENTITY_ID, "off")
    hass.states.async_set("schedule.other_laundry", "on")
    for schedule in (SCHEDULE_ENTITY_ID, "schedule.other_laundry", None):
        result = await hass.config_entries.options.async_init(init_integration.entry_id)
        schema = result["data_schema"].schema
        selector = next(value for key, value in schema.items() if key == CONF_OPENING_HOURS)
        assert selector.config["domain"] == ["schedule"]
        user_input: dict[str, float | str] = {
            CONF_MACHINES_INTERVAL: 15.0,
            CONF_ACCOUNT_INTERVAL: 120.0,
        }
        if schedule is not None:
            user_input[CONF_OPENING_HOURS] = schedule
        result = await hass.config_entries.options.async_configure(result["flow_id"], user_input)
        await hass.async_block_till_done()

        assert result["type"] is FlowResultType.CREATE_ENTRY
        assert init_integration.options.get(CONF_OPENING_HOURS) == schedule
        assert init_integration.options[CONF_MACHINES_INTERVAL] == 15
        assert init_integration.options[CONF_ACCOUNT_INTERVAL] == 120
        runtime = init_integration.runtime_data
        if schedule == SCHEDULE_ENTITY_ID:
            assert runtime.machines.update_interval is None
            assert runtime.account.update_interval is None
        else:
            assert runtime.machines.update_interval.total_seconds() == 15
            assert runtime.account.update_interval.total_seconds() == 120
