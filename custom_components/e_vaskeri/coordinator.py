"""Data update coordinators for the E-Vaskeri integration."""

from __future__ import annotations

from abc import abstractmethod
import asyncio
from collections.abc import Awaitable, Callable
from datetime import datetime, timedelta
import logging
from typing import TYPE_CHECKING, Any

from homeassistant.const import STATE_OFF, STATE_ON
from homeassistant.core import Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryAuthFailed
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import EVaskeriAuthError, EVaskeriClient, EVaskeriError
from .const import (
    CONF_ACCOUNT_INTERVAL,
    CONF_MACHINES_INTERVAL,
    CONF_OPENING_HOURS,
    DEFAULT_ACCOUNT_INTERVAL,
    DEFAULT_MACHINES_INTERVAL,
    DOMAIN,
    EVENT_CYCLE_FINISHED,
    MESSAGES_LIMIT,
    PERIODS_LIMIT,
    STATE_BUSY,
    STATE_DONE,
    STATE_FREE,
    STATEMENT_LIMIT,
    STATS_MONTHS,
)

if TYPE_CHECKING:
    from . import EVaskeriConfigEntry

_LOGGER = logging.getLogger(__name__)

type CycleFinishedListener = Callable[[dict[str, Any]], None]

# Statement times have minute resolution and come from another clock.
OWNERSHIP_GRACE = timedelta(minutes=5)
# How far back to look for a cycle that was already running when Home Assistant started.
MAX_UNOBSERVED_CYCLE = timedelta(hours=4)


@callback
def async_setup_opening_hours(
    hass: HomeAssistant,
    entry: EVaskeriConfigEntry,
    coordinators: tuple[MachinesCoordinator, AccountCoordinator],
) -> None:
    """Apply the optional schedule after the initial data has been fetched."""
    if not (schedule := entry.options.get(CONF_OPENING_HOURS)):
        return

    was_open: bool | None = None
    warned = False

    @callback
    def apply_schedule() -> None:
        nonlocal was_open, warned
        state = hass.states.get(schedule)
        usable = state is not None and state.state in (STATE_ON, STATE_OFF)
        if not usable and not warned:
            _LOGGER.warning(
                "Opening-hours schedule %s is missing or unavailable; polling is paused. "
                "Restore the helper or clear it in the E-Vaskeri options",
                schedule,
            )
        warned = not usable
        is_open = state is not None and state.state == STATE_ON
        if is_open == was_open:
            return
        refresh = was_open is False and is_open and not entry.pref_disable_polling
        was_open = is_open
        for coordinator in coordinators:
            coordinator.async_set_polling_paused(not is_open)
            if refresh:
                entry.async_create_background_task(
                    hass,
                    coordinator.async_refresh(),
                    f"{coordinator.name} opening-hours refresh",
                )

    @callback
    def schedule_changed(event: Event[EventStateChangedData]) -> None:
        apply_schedule()

    entry.async_on_unload(async_track_state_change_event(hass, schedule, schedule_changed))
    apply_schedule()


def machine_device_identifier(entry_id: str, machine_id: int) -> tuple[str, str]:
    """Return the device registry identifier of a machine."""
    return (DOMAIN, f"{entry_id}_{machine_id}")


class EVaskeriCoordinator[DataT](DataUpdateCoordinator[DataT]):
    """Base coordinator translating client errors into coordinator errors."""

    config_entry: EVaskeriConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: EVaskeriConfigEntry,
        client: EVaskeriClient,
        name: str,
        interval: int,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} {name}",
            update_interval=timedelta(seconds=interval),
        )
        self.client = client
        self._polling_interval = timedelta(seconds=interval)
        self._polling_paused = False

    @callback
    def async_set_polling_paused(self, paused: bool) -> None:
        """Suspend polling without changing data, availability or freshness."""
        self._polling_paused = paused
        self.update_interval = None if paused else self._polling_interval
        if paused:
            self._unschedule_refresh()

    async def _async_refresh(
        self,
        log_failures: bool = True,
        raise_on_auth_failed: bool = False,
        scheduled: bool = False,
        raise_on_entry_error: bool = False,
    ) -> None:
        # Gate inside the coordinator lock, including queued and manual refreshes.
        if self._polling_paused:
            return
        await super()._async_refresh(
            log_failures=log_failures,
            raise_on_auth_failed=raise_on_auth_failed,
            scheduled=scheduled,
            raise_on_entry_error=raise_on_entry_error,
        )

    async def _async_update_data(self) -> DataT:
        try:
            return await self._async_fetch()
        except EVaskeriAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except EVaskeriError as err:
            raise UpdateFailed(str(err)) from err

    @abstractmethod
    async def _async_fetch(self) -> DataT:
        """Fetch fresh data from the API."""


class MachinesCoordinator(EVaskeriCoordinator[dict[str, Any]]):
    """Polls the machine list and announces finished cycles."""

    def __init__(
        self, hass: HomeAssistant, entry: EVaskeriConfigEntry, client: EVaskeriClient
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            entry,
            client,
            "machines",
            entry.options.get(CONF_MACHINES_INTERVAL, DEFAULT_MACHINES_INTERVAL),
        )
        self._cycle_listeners: list[CycleFinishedListener] = []
        self._started_at = dt_util.utcnow()
        self._last_not_busy: dict[int, datetime] = {}
        self._reset_cycle_baseline = False
        self._cycle_generation = 0

    @callback
    def async_set_polling_paused(self, paused: bool) -> None:
        """Do not infer cycle completions across an unobserved closed period."""
        super().async_set_polling_paused(paused)
        if paused:
            self._reset_cycle_baseline = True
            self._cycle_generation += 1

    @callback
    def async_add_cycle_finished_listener(
        self, listener: CycleFinishedListener
    ) -> Callable[[], None]:
        """Register a listener for finished cycles and return its remover."""
        self._cycle_listeners.append(listener)

        @callback
        def remove() -> None:
            self._cycle_listeners.remove(listener)

        return remove

    async def _async_fetch(self) -> dict[str, Any]:
        generation = self._cycle_generation
        data = await self.client.async_get_machines()
        if self.data is not None and not self._reset_cycle_baseline:
            await self._async_announce_finished_cycles(self.data, data)
        now = dt_util.utcnow()
        # A request started before closing cannot establish the reopening baseline.
        if self._reset_cycle_baseline and generation == self._cycle_generation:
            self._last_not_busy.clear()
            self._started_at = now
            self._reset_cycle_baseline = self._polling_paused
        for machine in data["machines"]:
            if machine["state"] != STATE_BUSY:
                self._last_not_busy[machine["id"]] = now
        return data

    async def _async_started_by_me(self, machine_id: int) -> bool | None:
        """Whether the account's statement has a usage for this machine since it was last free.

        Returns None when the statement cannot be read.
        """
        since = self._last_not_busy.get(machine_id, self._started_at - MAX_UNOBSERVED_CYCLE)
        since -= OWNERSHIP_GRACE
        runtime_data = getattr(self.config_entry, "runtime_data", None)
        account = runtime_data.account.data if runtime_data else None
        cached = (account or {}).get("statement")
        if cached is not None and _has_usage_since(cached, machine_id, since):
            return True
        # The cached statement may predate the cycle, so ask the API once more.
        try:
            statement = await self.client.async_get_statement(STATEMENT_LIMIT)
        except EVaskeriError as err:
            _LOGGER.debug("Statement unavailable for ownership check: %s", err)
            return None if cached is None else False
        return _has_usage_since(statement, machine_id, since)

    async def _async_announce_finished_cycles(
        self, previous: dict[str, Any], current: dict[str, Any]
    ) -> None:
        previous_by_id = {m["id"]: m for m in previous["machines"]}
        device_registry = dr.async_get(self.hass)
        entry_id = self.config_entry.entry_id
        for machine in current["machines"]:
            if self._reset_cycle_baseline:
                return
            before = previous_by_id.get(machine["id"])
            if (
                before is None
                or before["state"] != STATE_BUSY
                or machine["state"] not in (STATE_FREE, STATE_DONE)
            ):
                continue
            mine = await self._async_started_by_me(machine["id"])
            if self._reset_cycle_baseline:
                return
            device = device_registry.async_get_device_by_identifier(
                machine_device_identifier(entry_id, machine["id"]), entry_id
            )
            data = {
                "machine_id": machine["id"],
                "name": machine["name"],
                "type": machine["type"],
                "program": machine.get("program") or before.get("program"),
                "device_id": device.id if device else None,
                "entry_id": entry_id,
                "mine": mine,
            }
            self.hass.bus.async_fire(EVENT_CYCLE_FINISHED, data)
            for listener in list(self._cycle_listeners):
                listener(data)


def _has_usage_since(statement: dict[str, Any], machine_id: int, since: datetime) -> bool:
    """Whether the statement has a usage of the machine that started at or after `since`.

    Statement dates and times are local without an offset: read them in the Home Assistant
    time zone.
    """
    for entry in statement.get("entries") or []:
        if entry.get("kind") != "usage" or entry.get("unit_id") != machine_id:
            continue
        started = dt_util.parse_datetime(f"{entry.get('date')}T{entry.get('time')}")
        if started is not None and dt_util.as_utc(started) >= since:
            return True
    return False


class AccountCoordinator(EVaskeriCoordinator[dict[str, Any]]):
    """Polls balance, statement and statistics together with the optional extras.

    Periods, prices, messages and the booking calendar come from newer API versions or
    features a location may not have, so a failure there never fails the whole update.
    """

    def __init__(
        self, hass: HomeAssistant, entry: EVaskeriConfigEntry, client: EVaskeriClient
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            entry,
            client,
            "account",
            entry.options.get(CONF_ACCOUNT_INTERVAL, DEFAULT_ACCOUNT_INTERVAL),
        )

    async def _async_optional(self, key: str, request: Awaitable[dict[str, Any]]) -> Any:
        """Return an optional payload, keeping the previous one when it cannot be fetched."""
        try:
            return await request
        except EVaskeriAuthError:
            raise
        except EVaskeriError as err:
            _LOGGER.debug("Optional %s data unavailable: %s", key, err)
            return (self.data or {}).get(key)

    async def _async_fetch(self) -> dict[str, Any]:
        balance, statement, stats, periods, prices, messages, calendar = await asyncio.gather(
            self.client.async_get_balance(),
            self.client.async_get_statement(STATEMENT_LIMIT),
            self.client.async_get_stats(STATS_MONTHS),
            self._async_optional("periods", self.client.async_get_periods(PERIODS_LIMIT)),
            self._async_optional("prices", self.client.async_get_prices()),
            self._async_optional("messages", self.client.async_get_messages(MESSAGES_LIMIT)),
            self._async_optional("calendar", self.client.async_get_calendar()),
        )
        return {
            "balance": balance,
            "statement": statement,
            "stats": stats,
            "periods": periods,
            "prices": prices,
            "messages": messages,
            "calendar": calendar,
        }
