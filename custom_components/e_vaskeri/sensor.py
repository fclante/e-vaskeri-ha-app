"""Sensor platform for the E-Vaskeri integration."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import MATCH_ALL
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.typing import StateType
from homeassistant.util import dt as dt_util

from . import EVaskeriConfigEntry
from .const import DOMAIN, MACHINE_STATES, STATE_BUSY, STATE_UNKNOWN
from .coordinator import AccountCoordinator, MachinesCoordinator
from .entity import EVaskeriHubEntity, EVaskeriMachineEntity

PARALLEL_UPDATES = 0

DEFAULT_CURRENCY = "DKK"
MACHINE_STATE_KEY = "state"


def _parse_timestamp(value: str | None) -> datetime | None:
    return dt_util.parse_datetime(value) if value else None


def _free_of_type(machine_type: str) -> Callable[[dict[str, Any]], int]:
    def value(data: dict[str, Any]) -> int:
        return data["summary"].get("by_type", {}).get(machine_type, {}).get("free", 0)

    return value


def _next_free(data: dict[str, Any]) -> dict[str, Any] | None:
    return data["summary"].get("next_free")


@dataclass(frozen=True, kw_only=True)
class SummarySensorDescription(SensorEntityDescription):
    """Describes a hub sensor derived from the machines summary."""

    value_fn: Callable[[dict[str, Any]], StateType | datetime]
    attrs_fn: Callable[[dict[str, Any]], dict[str, Any]] | None = None


SUMMARY_SENSORS: tuple[SummarySensorDescription, ...] = (
    SummarySensorDescription(
        key="free_washers",
        translation_key="free_washers",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=_free_of_type("washer"),
    ),
    SummarySensorDescription(
        key="free_dryers",
        translation_key="free_dryers",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=_free_of_type("dryer"),
    ),
    SummarySensorDescription(
        key="free_machines",
        translation_key="free_machines",
        state_class=SensorStateClass.MEASUREMENT,
        value_fn=lambda data: data["summary"].get("free", 0),
    ),
    SummarySensorDescription(
        key="next_free",
        translation_key="next_free",
        device_class=SensorDeviceClass.TIMESTAMP,
        value_fn=lambda data: _parse_timestamp((_next_free(data) or {}).get("ends_at")),
        attrs_fn=lambda data: {
            "name": (_next_free(data) or {}).get("name"),
            "id": (_next_free(data) or {}).get("id"),
        },
    ),
)


@dataclass(frozen=True, kw_only=True)
class AccountSensorDescription(SensorEntityDescription):
    """Describes a monetary sensor derived from the account data."""

    value_fn: Callable[[dict[str, Any]], float | None]
    attrs_fn: Callable[[dict[str, Any]], dict[str, Any]] | None = None


def _last_payment(data: dict[str, Any]) -> dict[str, Any]:
    return data["balance"].get("last_payment") or {}


ACCOUNT_SENSORS: tuple[AccountSensorDescription, ...] = (
    AccountSensorDescription(
        key="balance",
        translation_key="balance",
        device_class=SensorDeviceClass.MONETARY,
        state_class=SensorStateClass.TOTAL,
        suggested_display_precision=2,
        value_fn=lambda data: data["balance"].get("balance_dkk"),
    ),
    AccountSensorDescription(
        key="previous_period_balance",
        translation_key="previous_period_balance",
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        value_fn=lambda data: data["balance"].get("previous_period_dkk"),
    ),
    AccountSensorDescription(
        key="current_month_spend",
        translation_key="current_month_spend",
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        value_fn=lambda data: data["stats"].get("current_month_spend_dkk"),
    ),
    AccountSensorDescription(
        key="last_payment",
        translation_key="last_payment",
        device_class=SensorDeviceClass.MONETARY,
        suggested_display_precision=2,
        value_fn=lambda data: _last_payment(data).get("amount_dkk"),
        attrs_fn=lambda data: {
            "date": _last_payment(data).get("date"),
            "description": _last_payment(data).get("description"),
        },
    ),
)


def _calendar(data: dict[str, Any]) -> dict[str, Any]:
    return data.get("calendar") or {}


def _next_slot(data: dict[str, Any]) -> dict[str, Any]:
    return _calendar(data).get("next_free_slot") or {}


def _next_slot_start(data: dict[str, Any]) -> datetime | None:
    """The slot start is local time without an offset: read it in the Home Assistant time zone."""
    start = _parse_timestamp(_next_slot(data).get("start"))
    return dt_util.as_utc(start) if start else None


def _bookings_remaining(data: dict[str, Any]) -> int | None:
    calendars = _calendar(data).get("calendars") or []
    return calendars[0].get("remaining_bookings") if calendars else None


def _messages(data: dict[str, Any]) -> list[dict[str, Any]]:
    return (data.get("messages") or {}).get("messages") or []


def _latest_message(data: dict[str, Any]) -> dict[str, Any] | None:
    """The newest message that is not a masked system e-mail such as a one-time code."""
    return next((m for m in _messages(data) if not m.get("redacted")), None)


@dataclass(frozen=True, kw_only=True)
class AccountInfoSensorDescription(SensorEntityDescription):
    """Describes a non-monetary sensor derived from the optional account data."""

    value_fn: Callable[[dict[str, Any]], StateType | datetime]
    attrs_fn: Callable[[dict[str, Any]], dict[str, Any]] | None = None
    exists_fn: Callable[[dict[str, Any]], bool]


def _has_calendar(data: dict[str, Any]) -> bool:
    return bool(_calendar(data).get("available"))


ACCOUNT_INFO_SENSORS: tuple[AccountInfoSensorDescription, ...] = (
    AccountInfoSensorDescription(
        key="next_bookable_slot",
        translation_key="next_bookable_slot",
        device_class=SensorDeviceClass.TIMESTAMP,
        exists_fn=_has_calendar,
        value_fn=_next_slot_start,
        attrs_fn=lambda data: {
            "end": _next_slot(data).get("end"),
            "free_unit_ids": _next_slot(data).get("free_unit_ids"),
            "calendar_id": _next_slot(data).get("calendar_id"),
        },
    ),
    AccountInfoSensorDescription(
        key="bookings_remaining",
        translation_key="bookings_remaining",
        state_class=SensorStateClass.MEASUREMENT,
        exists_fn=_has_calendar,
        value_fn=_bookings_remaining,
    ),
    AccountInfoSensorDescription(
        key="messages",
        translation_key="messages",
        state_class=SensorStateClass.MEASUREMENT,
        exists_fn=lambda data: data.get("messages") is not None,
        value_fn=lambda data: (data.get("messages") or {}).get("total", len(_messages(data))),
        attrs_fn=lambda data: {
            "latest": _latest_message(data),
            "messages": _messages(data),
        },
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVaskeriConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the E-Vaskeri sensors."""
    machines = entry.runtime_data.machines
    account = entry.runtime_data.account

    async_add_entities(
        [
            *(EVaskeriSummarySensor(machines, description) for description in SUMMARY_SENSORS),
            EVaskeriMachinesOverviewSensor(machines),
            *(EVaskeriAccountSensor(account, description) for description in ACCOUNT_SENSORS),
            *(
                EVaskeriAccountInfoSensor(account, description)
                for description in ACCOUNT_INFO_SENSORS
                if description.exists_fn(account.data)
            ),
            EVaskeriAccountOverviewSensor(account),
        ]
    )

    known: set[int] = set()

    @callback
    def _async_add_new_machines() -> None:
        new = [m["id"] for m in machines.data["machines"] if m["id"] not in known]
        if not new:
            return
        known.update(new)
        async_add_entities(
            entity
            for machine_id in new
            for entity in (
                EVaskeriMachineStateSensor(machines, machine_id),
                EVaskeriMachineFinishesSensor(machines, machine_id),
            )
        )

    _async_add_new_machines()
    entry.async_on_unload(machines.async_add_listener(_async_add_new_machines))


class EVaskeriMachineStateSensor(EVaskeriMachineEntity, SensorEntity):
    """State of a single machine."""

    _attr_translation_key = "machine_state"
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = MACHINE_STATES

    def __init__(self, coordinator: MachinesCoordinator, machine_id: int) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, machine_id, MACHINE_STATE_KEY)

    @property
    def native_value(self) -> str | None:
        """Return the machine state."""
        machine = self.machine
        if machine is None:
            return None
        return machine["state"] if machine["state"] in MACHINE_STATES else STATE_UNKNOWN

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return program details."""
        machine = self.machine
        if machine is None:
            return None
        return {
            "program": machine.get("program"),
            "step": machine.get("step"),
            "raw_status": machine.get("raw_status"),
            "remaining_seconds": machine.get("remaining_seconds"),
            "ends_at": machine.get("ends_at"),
            "machine_id": machine["id"],
            "machine_type": machine.get("type"),
        }


class EVaskeriMachineFinishesSensor(EVaskeriMachineEntity, SensorEntity):
    """Time at which a running machine finishes."""

    _attr_translation_key = "machine_finishes"
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, coordinator: MachinesCoordinator, machine_id: int) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, machine_id, "finishes")

    @property
    def native_value(self) -> datetime | None:
        """Return the finish time, or None when the machine is not running."""
        machine = self.machine
        if machine is None or machine["state"] != STATE_BUSY:
            return None
        return _parse_timestamp(machine.get("ends_at"))


class EVaskeriSummarySensor(EVaskeriHubEntity[MachinesCoordinator], SensorEntity):
    """Hub sensor derived from the machines summary."""

    entity_description: SummarySensorDescription

    def __init__(
        self, coordinator: MachinesCoordinator, description: SummarySensorDescription
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> StateType | datetime:
        """Return the sensor value."""
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return additional attributes."""
        if self.entity_description.attrs_fn is None:
            return None
        return self.entity_description.attrs_fn(self.coordinator.data)


class EVaskeriMachinesOverviewSensor(EVaskeriHubEntity[MachinesCoordinator], SensorEntity):
    """Complete machine overview that powers the dashboard card."""

    _attr_translation_key = "machines_overview"
    _attr_state_class = SensorStateClass.MEASUREMENT
    _unrecorded_attributes = frozenset({MATCH_ALL})

    def __init__(self, coordinator: MachinesCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "machines_overview")

    async def async_added_to_hass(self) -> None:
        """Refresh the machine entity ids when entities get (re)named."""
        await super().async_added_to_hass()
        self.async_on_remove(
            self.hass.bus.async_listen(
                er.EVENT_ENTITY_REGISTRY_UPDATED,
                self._async_registry_updated,
                event_filter=_is_entity_added_or_renamed,
            )
        )

    @callback
    def _async_registry_updated(self, event: Event[er.EventEntityRegistryUpdatedData]) -> None:
        entity = er.async_get(self.hass).async_get(event.data["entity_id"])
        if (
            entity is not None
            and entity.platform == DOMAIN
            and entity.config_entry_id == self.coordinator.config_entry.entry_id
            and entity.unique_id.endswith(f"_{MACHINE_STATE_KEY}")
        ):
            self.async_write_ha_state()

    @property
    def native_value(self) -> int:
        """Return the number of free machines."""
        return self.coordinator.data["summary"].get("free", 0)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the machines with their Status sensor entity ids."""
        data = self.coordinator.data
        registry = er.async_get(self.hass)
        entry_id = self.coordinator.config_entry.entry_id
        return {
            "location": data.get("location"),
            "updated_at": data.get("updated_at"),
            "upstream_updated": data.get("upstream_updated"),
            "summary": data["summary"],
            "machines": [
                {
                    **machine,
                    "entity_id": registry.async_get_entity_id(
                        "sensor", DOMAIN, f"{entry_id}_{machine['id']}_{MACHINE_STATE_KEY}"
                    ),
                }
                for machine in data["machines"]
            ],
        }


@callback
def _is_entity_added_or_renamed(data: er.EventEntityRegistryUpdatedData) -> bool:
    return data["action"] == "create" or (data["action"] == "update" and "old_entity_id" in data)


class EVaskeriAccountSensor(EVaskeriHubEntity[AccountCoordinator], SensorEntity):
    """Monetary hub sensor derived from the account data."""

    entity_description: AccountSensorDescription

    def __init__(
        self, coordinator: AccountCoordinator, description: AccountSensorDescription
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, description.key)
        self.entity_description = description

    @property
    def native_unit_of_measurement(self) -> str:
        """Return the currency reported by the API."""
        return self.coordinator.data["balance"].get("currency") or DEFAULT_CURRENCY

    @property
    def native_value(self) -> float | None:
        """Return the sensor value."""
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return additional attributes."""
        if self.entity_description.attrs_fn is None:
            return None
        return self.entity_description.attrs_fn(self.coordinator.data)


class EVaskeriAccountInfoSensor(EVaskeriHubEntity[AccountCoordinator], SensorEntity):
    """Non-monetary hub sensor derived from the optional account data."""

    entity_description: AccountInfoSensorDescription

    def __init__(
        self, coordinator: AccountCoordinator, description: AccountInfoSensorDescription
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, description.key)
        self.entity_description = description

    @property
    def native_value(self) -> StateType | datetime:
        """Return the sensor value."""
        return self.entity_description.value_fn(self.coordinator.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        """Return additional attributes."""
        if self.entity_description.attrs_fn is None:
            return None
        return self.entity_description.attrs_fn(self.coordinator.data)


class EVaskeriAccountOverviewSensor(EVaskeriHubEntity[AccountCoordinator], SensorEntity):
    """Complete account overview that powers the dashboard card."""

    _attr_translation_key = "account_overview"
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_state_class = SensorStateClass.TOTAL
    _attr_suggested_display_precision = 2
    _unrecorded_attributes = frozenset({MATCH_ALL})

    def __init__(self, coordinator: AccountCoordinator) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, "account_overview")

    @property
    def native_unit_of_measurement(self) -> str:
        """Return the currency reported by the API."""
        return self.coordinator.data["balance"].get("currency") or DEFAULT_CURRENCY

    @property
    def native_value(self) -> float | None:
        """Return the account balance."""
        return self.coordinator.data["balance"].get("balance_dkk")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the account details."""
        balance = self.coordinator.data["balance"]
        return {
            "currency": balance.get("currency") or DEFAULT_CURRENCY,
            "balance_dkk": balance.get("balance_dkk"),
            "owed_dkk": balance.get("owed_dkk"),
            "previous_period_dkk": balance.get("previous_period_dkk"),
            "last_payment": balance.get("last_payment"),
            "stats": self.coordinator.data["stats"],
            "recent": self.coordinator.data["statement"].get("entries", []),
            "periods": (self.coordinator.data.get("periods") or {}).get("periods", []),
            "prices": (self.coordinator.data.get("prices") or {}).get("groups", []),
            "updated_at": balance.get("updated_at"),
        }
