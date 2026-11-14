"""Tests for the E-Vaskeri config and options flows."""

from __future__ import annotations

import aiohttp
from homeassistant.config_entries import SOURCE_REAUTH, SOURCE_RECONFIGURE, SOURCE_USER
from homeassistant.const import CONF_API_KEY, CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.e_vaskeri.const import (
    CONF_ACCOUNT_INTERVAL,
    CONF_MACHINES_INTERVAL,
    DOMAIN,
)

from .conftest import BASE_URL, mock_api


async def test_user_flow_success(hass: HomeAssistant, aioclient_mock: AiohttpClientMocker) -> None:
    """A valid URL creates an entry titled after the location."""
    mock_api(aioclient_mock)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: f"{BASE_URL}/ "}
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Example Laundry"
    assert result["data"] == {CONF_URL: BASE_URL, CONF_API_KEY: None}
    assert result["result"].unique_id == BASE_URL


@pytest.mark.parametrize(
    ("kwargs", "error"),
    [
        ({"exc": aiohttp.ClientError}, "cannot_connect"),
        ({"status": 500}, "cannot_connect"),
        ({"exc": TimeoutError}, "cannot_connect"),
        ({"status": 401}, "invalid_auth"),
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


async def test_user_flow_sends_api_key(
    hass: HomeAssistant, aioclient_mock: AiohttpClientMocker
) -> None:
    """The API key is sent as X-API-Key header."""
    mock_api(aioclient_mock)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: BASE_URL, CONF_API_KEY: "secret"}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"][CONF_API_KEY] == "secret"
    assert all(call[3]["X-API-Key"] == "secret" for call in aioclient_mock.mock_calls)


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


async def test_reauth_flow(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """A new API key can be supplied after the API rejected the old one."""
    mock_api(aioclient_mock)
    mock_config_entry.add_to_hass(hass)
    result = await mock_config_entry.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"
    assert hass.config_entries.flow.async_progress()[0]["context"]["source"] == SOURCE_REAUTH

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_API_KEY: "new-key"}
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reauth_successful"
    assert mock_config_entry.data[CONF_API_KEY] == "new-key"


async def test_reconfigure_flow(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """The URL and unique id can be changed."""
    mock_api(aioclient_mock)
    mock_config_entry.add_to_hass(hass)
    result = await mock_config_entry.start_reconfigure_flow(hass)
    assert result["step_id"] == SOURCE_RECONFIGURE

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: BASE_URL, CONF_API_KEY: "k"}
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert mock_config_entry.data[CONF_API_KEY] == "k"


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
