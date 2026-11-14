"""Base entities for the E-Vaskeri integration."""

from __future__ import annotations

from typing import Any

from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, MANUFACTURER
from .coordinator import (
    EVaskeriCoordinator,
    MachinesCoordinator,
    machine_device_identifier,
)

MODEL_BY_TYPE = {"washer": "Washer", "dryer": "Dryer", "mangle": "Mangle"}


class EVaskeriHubEntity[CoordinatorT: EVaskeriCoordinator[Any]](CoordinatorEntity[CoordinatorT]):
    """Entity attached to the laundry hub device."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: CoordinatorT, key: str) -> None:
        """Initialize the entity."""
        super().__init__(coordinator)
        entry_id = coordinator.config_entry.entry_id
        self._attr_unique_id = f"{entry_id}_{key}"
        self._attr_device_info = DeviceInfo(identifiers={(DOMAIN, entry_id)})


class EVaskeriMachineEntity(CoordinatorEntity[MachinesCoordinator]):
    """Entity attached to a single machine device."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: MachinesCoordinator, machine_id: int, key: str) -> None:
        """Initialize the entity."""
        super().__init__(coordinator)
        entry_id = coordinator.config_entry.entry_id
        self.machine_id = machine_id
        self._attr_unique_id = f"{entry_id}_{machine_id}_{key}"
        machine = self.machine or {}
        hub = dr.async_get(coordinator.hass).async_get_device_by_identifier(
            (DOMAIN, entry_id), entry_id
        )
        self._attr_device_info = DeviceInfo(
            identifiers={machine_device_identifier(entry_id, machine_id)},
            name=machine.get("name", f"Machine {machine_id}"),
            manufacturer=MANUFACTURER,
            model=MODEL_BY_TYPE.get(machine.get("type", ""), "Machine"),
            via_device_id=hub.id if hub else None,
        )

    @property
    def machine(self) -> dict[str, Any] | None:
        """Return the current API data of this machine."""
        for machine in self.coordinator.data["machines"]:
            if machine["id"] == self.machine_id:
                return machine
        return None

    @property
    def available(self) -> bool:
        """Return whether the machine is still reported by the API."""
        return super().available and self.machine is not None
