"""Binary sensor platform for the E-Vaskeri integration."""

from __future__ import annotations

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import EVaskeriConfigEntry
from .const import STATE_BUSY, STATE_DONE, STATE_FREE
from .coordinator import MachinesCoordinator
from .entity import EVaskeriMachineEntity

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVaskeriConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the E-Vaskeri binary sensors."""
    coordinator = entry.runtime_data.machines
    known: set[int] = set()

    @callback
    def _async_add_new_machines() -> None:
        new = [m["id"] for m in coordinator.data["machines"] if m["id"] not in known]
        if not new:
            return
        known.update(new)
        async_add_entities(
            EVaskeriMachineInUseSensor(coordinator, machine_id) for machine_id in new
        )

    _async_add_new_machines()
    entry.async_on_unload(coordinator.async_add_listener(_async_add_new_machines))


class EVaskeriMachineInUseSensor(EVaskeriMachineEntity, BinarySensorEntity):
    """On while a machine is running or waiting to be emptied."""

    _attr_translation_key = "machine_in_use"
    _attr_device_class = BinarySensorDeviceClass.OCCUPANCY

    def __init__(self, coordinator: MachinesCoordinator, machine_id: int) -> None:
        """Initialize the binary sensor."""
        super().__init__(coordinator, machine_id, "in_use")

    @property
    def is_on(self) -> bool | None:
        """Return whether the machine is unavailable for use."""
        machine = self.machine
        if machine is None or machine["state"] not in (STATE_FREE, STATE_BUSY, STATE_DONE):
            return None
        return machine["state"] != STATE_FREE
