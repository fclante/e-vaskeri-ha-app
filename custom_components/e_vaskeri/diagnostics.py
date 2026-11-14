"""Diagnostics for the E-Vaskeri integration."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import CONF_API_KEY, CONF_URL
from homeassistant.core import HomeAssistant

from . import EVaskeriConfigEntry

TO_REDACT = {CONF_API_KEY, CONF_URL, "unique_id"}
# Message texts come from the landlord and are personal, so they are not included in diagnostics.
ACCOUNT_TO_REDACT = {"body"}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: EVaskeriConfigEntry
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    runtime_data = entry.runtime_data
    return {
        "entry": async_redact_data(entry.as_dict(), TO_REDACT),
        "machines": runtime_data.machines.data,
        "account": async_redact_data(runtime_data.account.data, ACCOUNT_TO_REDACT),
    }
