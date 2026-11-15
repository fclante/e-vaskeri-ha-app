"""Config flow for the E-Vaskeri integration."""

from __future__ import annotations

from collections.abc import Mapping
import logging
from typing import Any

from homeassistant.config_entries import (
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlowWithReload,
)
from homeassistant.const import CONF_URL
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    EntitySelector,
    EntitySelectorConfig,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
)
import voluptuous as vol
from yarl import URL

from . import EVaskeriConfigEntry
from .api import EVaskeriAuthError, EVaskeriClient, EVaskeriConnectionError
from .const import (
    CONF_ACCOUNT_INTERVAL,
    CONF_MACHINES_INTERVAL,
    CONF_OPENING_HOURS,
    DEFAULT_ACCOUNT_INTERVAL,
    DEFAULT_HUB_NAME,
    DEFAULT_MACHINES_INTERVAL,
    DOMAIN,
    MAX_INTERVAL,
    MIN_ACCOUNT_INTERVAL,
    MIN_MACHINES_INTERVAL,
)

_LOGGER = logging.getLogger(__name__)


class InvalidUrlError(Exception):
    """The supplied base URL is not a valid HTTP(S) URL."""


def normalize_url(value: str) -> str:
    """Return the base URL without query, fragment or trailing slash."""
    text = value.strip()
    if "://" not in text:
        text = f"http://{text}"
    try:
        url = URL(text)
    except ValueError as err:
        raise InvalidUrlError from err
    if url.scheme not in ("http", "https") or not url.host:
        raise InvalidUrlError
    return str(url.with_query(None).with_fragment(None)).rstrip("/")


def _user_schema(url: str | None = None) -> vol.Schema:
    return vol.Schema({vol.Required(CONF_URL, default=url or vol.UNDEFINED): str})


class EVaskeriConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for E-Vaskeri."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: EVaskeriConfigEntry) -> EVaskeriOptionsFlow:
        """Return the options flow."""
        return EVaskeriOptionsFlow()

    async def _async_validate(self, url: str) -> tuple[str | None, dict[str, str]]:
        """Return the location name and form errors for the given API URL."""
        client = EVaskeriClient(async_get_clientsession(self.hass), url)
        try:
            await client.async_health()
            machines = await client.async_get_machines()
        except EVaskeriAuthError:
            return None, {"base": "invalid_auth"}
        except EVaskeriConnectionError:
            return None, {"base": "cannot_connect"}
        except Exception:
            _LOGGER.exception("Unexpected exception while validating the API")
            return None, {"base": "unknown"}
        return machines.get("location"), {}

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                url = normalize_url(user_input[CONF_URL])
            except InvalidUrlError:
                errors["base"] = "invalid_url"
            else:
                await self.async_set_unique_id(url)
                self._abort_if_unique_id_configured()
                location, errors = await self._async_validate(url)
                if not errors:
                    return self.async_create_entry(
                        title=location or DEFAULT_HUB_NAME,
                        data={CONF_URL: url},
                    )
        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(_user_schema(), user_input),
            errors=errors,
        )

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        """Offer a retry after access to the API was denied."""
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Retry access without requesting credentials."""
        entry = self._get_reauth_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            _, errors = await self._async_validate(entry.data[CONF_URL])
            if not errors:
                return self.async_update_reload_and_abort(entry)
        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema({}),
            errors=errors,
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Change the base URL."""
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                url = normalize_url(user_input[CONF_URL])
            except InvalidUrlError:
                errors["base"] = "invalid_url"
            else:
                existing = await self.async_set_unique_id(url, raise_on_progress=False)
                if existing is not None and existing.entry_id != entry.entry_id:
                    return self.async_abort(reason="already_configured")
                _, errors = await self._async_validate(url)
                if not errors:
                    return self.async_update_reload_and_abort(
                        entry,
                        unique_id=url,
                        data_updates={CONF_URL: url},
                    )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=_user_schema((user_input or entry.data)[CONF_URL]),
            errors=errors,
        )


class EVaskeriOptionsFlow(OptionsFlowWithReload):
    """Handle the polling interval options."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Manage the polling intervals."""
        if user_input is not None:
            new_options: dict[str, Any] = {
                key: int(user_input[key]) for key in (CONF_MACHINES_INTERVAL, CONF_ACCOUNT_INTERVAL)
            }
            if schedule := user_input.get(CONF_OPENING_HOURS):
                new_options[CONF_OPENING_HOURS] = schedule
            return self.async_create_entry(data=new_options)
        options = self.config_entry.options
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_MACHINES_INTERVAL,
                        default=options.get(CONF_MACHINES_INTERVAL, DEFAULT_MACHINES_INTERVAL),
                    ): _interval_selector(MIN_MACHINES_INTERVAL),
                    vol.Required(
                        CONF_ACCOUNT_INTERVAL,
                        default=options.get(CONF_ACCOUNT_INTERVAL, DEFAULT_ACCOUNT_INTERVAL),
                    ): _interval_selector(MIN_ACCOUNT_INTERVAL),
                    vol.Optional(
                        CONF_OPENING_HOURS,
                        description={"suggested_value": options.get(CONF_OPENING_HOURS)},
                    ): EntitySelector(EntitySelectorConfig(domain="schedule")),
                }
            ),
        )


def _interval_selector(minimum: int) -> NumberSelector:
    return NumberSelector(
        NumberSelectorConfig(
            min=minimum,
            max=MAX_INTERVAL,
            step=1,
            unit_of_measurement="s",
            mode=NumberSelectorMode.BOX,
        )
    )
