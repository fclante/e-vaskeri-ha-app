"""Tests for the bundled notification blueprint."""

from __future__ import annotations

from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
import pytest
from pytest_homeassistant_custom_component.common import async_mock_service

from custom_components.e_vaskeri.const import EVENT_CYCLE_FINISHED

PLUGIN_DIR = Path(__file__).parent.parent


async def test_notify_blueprint(hass: HomeAssistant) -> None:
    """The blueprint filters by type and renders the message template."""
    hass.config.config_dir = str(PLUGIN_DIR)
    calls = async_mock_service(hass, "notify", "phone")
    assert await async_setup_component(
        hass,
        "automation",
        {
            "automation": {
                "use_blueprint": {
                    "path": "e_vaskeri/notify_cycle_finished.yaml",
                    "input": {
                        "machine_types": ["washer"],
                        "notify_service": "notify.phone",
                    },
                }
            }
        },
    )
    event = {"machine_id": 3, "name": "Vaskemaskine 3", "program": "40° Mild", "device_id": "d"}

    hass.bus.async_fire(EVENT_CYCLE_FINISHED, {**event, "type": "dryer"})
    await hass.async_block_till_done()
    assert calls == []

    hass.bus.async_fire(EVENT_CYCLE_FINISHED, {**event, "type": "washer"})
    await hass.async_block_till_done()
    assert len(calls) == 1
    assert calls[0].data == {
        "title": "E-Vaskeri",
        "message": "Vaskemaskine 3 is finished (40° Mild).",
    }


@pytest.mark.parametrize(("mine", "notified"), [(True, True), (False, False), (None, False)])
async def test_notify_blueprint_only_mine(
    hass: HomeAssistant, mine: bool | None, notified: bool
) -> None:
    """With only_mine, only cycles paid from the user's account notify."""
    hass.config.config_dir = str(PLUGIN_DIR)
    calls = async_mock_service(hass, "notify", "phone")
    blueprint = {
        "path": "e_vaskeri/notify_cycle_finished.yaml",
        "input": {"only_mine": True, "notify_service": "notify.phone"},
    }
    assert await async_setup_component(
        hass, "automation", {"automation": {"use_blueprint": blueprint}}
    )

    hass.bus.async_fire(
        EVENT_CYCLE_FINISHED,
        {
            "machine_id": 3,
            "name": "Vaskemaskine 3",
            "type": "washer",
            "device_id": "d",
            "mine": mine,
        },
    )
    await hass.async_block_till_done()
    assert len(calls) == int(notified)
