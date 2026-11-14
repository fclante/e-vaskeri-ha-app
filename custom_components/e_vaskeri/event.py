"""Event platform for the E-Vaskeri integration."""

from __future__ import annotations

from typing import Any

from homeassistant.components.event import EventEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import EVaskeriConfigEntry
from .const import CYCLE_FINISHED_EVENT_TYPE
from .coordinator import MachinesCoordinator
from .entity import EVaskeriHubEntity

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: EVaskeriConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the E-Vaskeri event entity."""
    async_add_entities([EVaskeriCycleFinishedEvent(entry.runtime_data.machines)])


class EVaskeriCycleFinishedEvent(EVaskeriHubEntity[MachinesCoordinator], EventEntity):
    """Triggers whenever a machine finishes a cycle."""

    _attr_translation_key = "cycle_finished"
    _attr_event_types = [CYCLE_FINISHED_EVENT_TYPE]

    def __init__(self, coordinator: MachinesCoordinator) -> None:
        """Initialize the event entity."""
        super().__init__(coordinator, CYCLE_FINISHED_EVENT_TYPE)

    async def async_added_to_hass(self) -> None:
        """Subscribe to finished cycles."""
        await super().async_added_to_hass()
        self.async_on_remove(
            self.coordinator.async_add_cycle_finished_listener(self._async_handle_cycle)
        )

    @callback
    def _async_handle_cycle(self, data: dict[str, Any]) -> None:
        self._trigger_event(CYCLE_FINISHED_EVENT_TYPE, data)
        self.async_write_ha_state()
