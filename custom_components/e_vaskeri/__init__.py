"""The E-Vaskeri integration."""

from __future__ import annotations

from dataclasses import dataclass
import logging
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_API_KEY, CONF_URL, Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration

from .api import EVaskeriClient
from .const import CARD_URL_PATH, DEFAULT_HUB_NAME, DOMAIN, MANUFACTURER
from .coordinator import AccountCoordinator, MachinesCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.BINARY_SENSOR, Platform.EVENT, Platform.SENSOR]
CARD_FILE = Path(__file__).parent / "www" / "e-vaskeri-card.js"
CARD_REGISTERED = f"{DOMAIN}_card_registered"

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type EVaskeriConfigEntry = ConfigEntry[EVaskeriData]


@dataclass
class EVaskeriData:
    """Runtime data of a config entry."""

    machines: MachinesCoordinator
    account: AccountCoordinator


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the Lovelace card and load it in the frontend."""
    if hass.data.get(CARD_REGISTERED):
        return True
    if not await hass.async_add_executor_job(CARD_FILE.is_file):
        _LOGGER.warning(
            "Dashboard card %s not found; the custom card will not be available",
            CARD_FILE,
        )
        return True

    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL_PATH, str(CARD_FILE), cache_headers=False)]
    )
    version = (await async_get_integration(hass, DOMAIN)).version
    frontend.add_extra_js_url(hass, f"{CARD_URL_PATH}?v={version}")
    hass.data[CARD_REGISTERED] = True
    return True


async def async_setup_entry(hass: HomeAssistant, entry: EVaskeriConfigEntry) -> bool:
    """Set up E-Vaskeri from a config entry."""
    client = EVaskeriClient(
        async_get_clientsession(hass), entry.data[CONF_URL], entry.data.get(CONF_API_KEY)
    )
    machines = MachinesCoordinator(hass, entry, client)
    account = AccountCoordinator(hass, entry, client)
    await machines.async_config_entry_first_refresh()
    await account.async_config_entry_first_refresh()
    entry.runtime_data = EVaskeriData(machines=machines, account=account)

    dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id,
        identifiers={(DOMAIN, entry.entry_id)},
        manufacturer=MANUFACTURER,
        name=machines.data.get("location") or DEFAULT_HUB_NAME,
    )

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: EVaskeriConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
