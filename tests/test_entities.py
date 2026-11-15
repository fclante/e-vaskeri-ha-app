"""Tests for the E-Vaskeri entities, events and diagnostics."""

from __future__ import annotations

from datetime import datetime, timedelta

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_capture_events,
    async_fire_time_changed,
)
from pytest_homeassistant_custom_component.test_util.aiohttp import AiohttpClientMocker

from custom_components.e_vaskeri.const import DOMAIN, EVENT_CYCLE_FINISHED
from custom_components.e_vaskeri.diagnostics import async_get_config_entry_diagnostics

from .conftest import BASE_URL, SCHEDULE_ENTITY_ID, load_sample, machines_with_state, mock_api

HUB = "example_laundry"


def expected_slot_start() -> str:
    """The sample slot starts at 07:00 local time on 2025-01-16, shown as a UTC timestamp."""
    local = datetime(2025, 1, 16, 7, 0, tzinfo=dt_util.DEFAULT_TIME_ZONE)
    return dt_util.as_utc(local).isoformat()


async def test_busy_washer(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """A running washer reports its program and end time."""
    status = hass.states.get("sensor.vaskemaskine_3_status")
    assert status.state == "busy"
    assert status.attributes["program"] == "95° Normal"
    assert status.attributes["step"] == "Hovedvask"
    assert status.attributes["raw_status"] == "OPTAGET"
    assert status.attributes["remaining_seconds"] == 1901
    assert status.attributes["ends_at"] == "2025-01-15T13:31:41+00:00"
    assert status.attributes["machine_id"] == 3
    assert status.attributes["machine_type"] == "washer"
    assert hass.states.get("sensor.vaskemaskine_3_finishes").state == "2025-01-15T13:31:41+00:00"
    assert hass.states.get("binary_sensor.vaskemaskine_3_in_use").state == "on"


async def test_done_washer(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """A finished washer still counts as in use but has no end time."""
    assert hass.states.get("sensor.vaskemaskine_6_status").state == "done"
    assert hass.states.get("sensor.vaskemaskine_6_finishes").state == "unknown"
    assert hass.states.get("binary_sensor.vaskemaskine_6_in_use").state == "on"


async def test_free_dryer(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """A free dryer is off and has no program."""
    status = hass.states.get("sensor.torretumbler_9_status")
    assert status.state == "free"
    assert status.attributes["program"] is None
    assert hass.states.get("sensor.torretumbler_9_finishes").state == "unknown"
    assert hass.states.get("binary_sensor.torretumbler_9_in_use").state == "off"


async def test_summary_sensors(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """Summary sensors follow the API summary."""
    assert hass.states.get(f"sensor.{HUB}_free_washers").state == "6"
    assert hass.states.get(f"sensor.{HUB}_free_dryers").state == "2"
    assert hass.states.get(f"sensor.{HUB}_free_machines").state == "9"
    next_free = hass.states.get(f"sensor.{HUB}_next_free")
    assert next_free.state == "2025-01-15T13:22:10+00:00"
    assert next_free.attributes["name"] == "Tørretumbler 10"
    assert next_free.attributes["id"] == 10


async def test_machines_overview(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """The overview carries the verbatim API data plus Status entity ids."""
    sample = load_sample("machines")
    overview = hass.states.get(f"sensor.{HUB}_machines_overview")

    assert overview.state == "9"
    assert overview.attributes["location"] == "Example Laundry"
    assert overview.attributes["updated_at"] == sample["updated_at"]
    assert overview.attributes["upstream_updated"] == "13:01"
    assert overview.attributes["summary"] == sample["summary"]
    machines = overview.attributes["machines"]
    assert [{k: v for k, v in m.items() if k != "entity_id"} for m in machines] == sample[
        "machines"
    ]
    assert machines[2]["entity_id"] == "sensor.vaskemaskine_3_status"
    assert machines[8]["entity_id"] == "sensor.torretumbler_9_status"
    registry = er.async_get(hass)
    assert all(registry.async_get(m["entity_id"]) for m in machines)


async def test_account_sensors(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """Monetary sensors report the account in DKK."""
    balance = hass.states.get(f"sensor.{HUB}_balance")
    assert balance.state == "25.0"
    assert balance.attributes["unit_of_measurement"] == "DKK"
    assert hass.states.get(f"sensor.{HUB}_previous_period").state == "5.0"
    assert hass.states.get(f"sensor.{HUB}_spend_this_month").state == "15.0"
    last_payment = hass.states.get(f"sensor.{HUB}_last_payment")
    assert last_payment.state == "20.0"
    assert last_payment.attributes["date"] == "2025-01-14"
    assert last_payment.attributes["description"] == "Example payment"


async def test_account_overview(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """The account overview exposes stats and recent statement entries."""
    balance = load_sample("balance")
    overview = hass.states.get(f"sensor.{HUB}_account_overview")

    assert overview.state == "25.0"
    assert overview.attributes["unit_of_measurement"] == "DKK"
    assert overview.attributes["currency"] == "DKK"
    assert overview.attributes["balance_dkk"] == 25.0
    assert overview.attributes["owed_dkk"] == 0.0
    assert overview.attributes["previous_period_dkk"] == 5.0
    assert overview.attributes["last_payment"] == balance["last_payment"]
    assert overview.attributes["stats"] == load_sample("stats")
    assert overview.attributes["recent"] == load_sample("statement")["entries"]
    assert overview.attributes["updated_at"] == balance["updated_at"]


async def test_statement_limit_requested(
    hass: HomeAssistant, init_integration: MockConfigEntry, aioclient_mock: AiohttpClientMocker
) -> None:
    """The statement is fetched with limit 15 and stats with 12 months."""
    queries = {
        str(call[1].path): call[1].query_string
        for call in aioclient_mock.mock_calls
        if "/api/v1/" in str(call[1])
    }
    assert queries["/api/v1/statement"] == "limit=15"
    assert queries["/api/v1/stats"] == "months=12"


@pytest.mark.parametrize("new_state", ["free", "done"])
async def test_cycle_finished_event(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
    new_state: str,
) -> None:
    """busy -> free/done fires the bus event and the event entity."""
    bus_events = async_capture_events(hass, EVENT_CYCLE_FINISHED)
    assert bus_events == []  # nothing fired by the first refresh

    mock_api(
        aioclient_mock,
        machines=machines_with_state(
            3, state=new_state, program=None, step=None, ends_at=None, remaining_seconds=None
        ),
    )
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=31))
    await hass.async_block_till_done()

    assert len(bus_events) == 1
    device = dr.async_get(hass).async_get_device_by_identifier(
        (DOMAIN, f"{init_integration.entry_id}_3"), init_integration.entry_id
    )
    assert bus_events[0].data == {
        "machine_id": 3,
        "name": "Vaskemaskine 3",
        "type": "washer",
        "program": "95° Normal",
        "device_id": device.id,
        "entry_id": init_integration.entry_id,
        "mine": False,
    }
    entity = hass.states.get(f"event.{HUB}_cycle_finished")
    assert entity.attributes["event_type"] == "cycle_finished"
    assert entity.attributes["machine_id"] == 3
    assert entity.attributes["device_id"] == device.id

    # A further refresh with an unchanged state must not fire again.
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=62))
    await hass.async_block_till_done()
    assert len(bus_events) == 1


@pytest.mark.parametrize("failed_reopening", [False, True])
async def test_no_cycle_events_across_closed_period(
    hass: HomeAssistant,
    scheduled_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
    failed_reopening: bool,
) -> None:
    """Only transitions observed after the first successful reopening fetch emit events."""
    events = async_capture_events(hass, EVENT_CYCLE_FINISHED)
    hass.states.async_set(SCHEDULE_ENTITY_ID, "off")
    await hass.async_block_till_done()
    if failed_reopening:
        mock_api(aioclient_mock, status=500)
    else:
        mock_api(aioclient_mock, machines=machines_with_state(3, state="free"))
    hass.states.async_set(SCHEDULE_ENTITY_ID, "on")
    await hass.async_block_till_done(wait_background_tasks=True)
    coordinator = scheduled_integration.runtime_data.machines
    if failed_reopening:
        assert not coordinator.last_update_success
        mock_api(aioclient_mock, machines=machines_with_state(3, state="free"))
        await coordinator.async_refresh()
    assert events == []
    assert hass.states.get("sensor.vaskemaskine_3_status").state == "free"

    mock_api(aioclient_mock, machines=machines_with_state(3, state="busy"))
    await coordinator.async_refresh()
    mock_api(aioclient_mock, machines=machines_with_state(3, state="free"))
    await coordinator.async_refresh()
    await hass.async_block_till_done()
    assert len(events) == 1
    assert events[0].data["machine_id"] == 3


def statement_with_usage(machine_id: int, started: datetime) -> dict:
    """The sample statement with a usage of the machine at a local start time."""
    local = dt_util.as_local(started)
    entry = {"kind": "usage", "unit_id": machine_id}
    entry |= {"date": local.strftime("%Y-%m-%d"), "time": local.strftime("%H:%M")}
    return {"entries": [entry, *load_sample("statement")["entries"]], "total": 1}


@pytest.mark.parametrize(
    ("started_offset", "mine"),
    [(timedelta(minutes=1), True), (timedelta(hours=-1), False)],
    ids=["started-after-free", "older-usage"],
)
async def test_cycle_finished_mine(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
    started_offset: timedelta,
    mine: bool,
) -> None:
    """A cycle is mine when the statement has a usage of the machine since it was last free."""
    bus_events = async_capture_events(hass, EVENT_CYCLE_FINISHED)
    free_at = dt_util.utcnow()  # washer 1 is free in the sample
    mock_api(aioclient_mock, machines=machines_with_state(1, state="busy"))
    async_fire_time_changed(hass, free_at + timedelta(seconds=31))
    await hass.async_block_till_done()

    mock_api(
        aioclient_mock,
        machines=machines_with_state(1, state="done"),
        statement=statement_with_usage(1, free_at + started_offset),
    )
    async_fire_time_changed(hass, free_at + timedelta(seconds=62))
    await hass.async_block_till_done()

    assert [e.data["mine"] for e in bus_events] == [mine]


async def test_cycle_finished_mine_unknown_without_statement(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """`mine` is None when the statement could never be read."""
    mock_api(aioclient_mock)
    mock_config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    mock_config_entry.runtime_data.account.data.pop("statement")
    bus_events = async_capture_events(hass, EVENT_CYCLE_FINISHED)

    aioclient_mock.clear_requests()
    aioclient_mock.get(f"{BASE_URL}/api/v1/machines", json=machines_with_state(3, state="free"))
    aioclient_mock.get(f"{BASE_URL}/api/v1/statement", status=500)
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=31))
    await hass.async_block_till_done()

    assert [e.data["mine"] for e in bus_events] == [None]


async def test_no_event_for_other_transitions(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """Only busy -> free/done counts; done -> free and free -> busy do not."""
    bus_events = async_capture_events(hass, EVENT_CYCLE_FINISHED)
    mock_api(
        aioclient_mock,
        machines=machines_with_state(6, state="free", program=None),
    )
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=31))
    await hass.async_block_till_done()
    mock_api(aioclient_mock, machines=machines_with_state(1, state="busy"))
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=62))
    await hass.async_block_till_done()

    assert bus_events == []


async def test_diagnostics(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """Diagnostics redact the URL and API key."""
    data = await async_get_config_entry_diagnostics(hass, init_integration)

    assert data["entry"]["data"]["url"] == "**REDACTED**"
    assert BASE_URL not in str(data)
    assert len(data["machines"]["machines"]) == 12
    assert data["account"]["balance"]["balance_dkk"] == 25.0
    assert "Example maintenance notice" in str(data["account"]["messages"])
    assert "unavailable for scheduled maintenance" not in str(data)


async def test_booking_sensors(hass: HomeAssistant, init_integration: MockConfigEntry) -> None:
    """The next bookable slot and the remaining bookings follow the calendar."""
    slot = hass.states.get(f"sensor.{HUB}_next_bookable_slot")
    # The slot is local time without an offset, so it is read in the Home Assistant time zone.
    assert slot.state == expected_slot_start()
    assert slot.attributes["end"] == "2025-01-16T10:00"
    assert slot.attributes["free_unit_ids"] == [1, 2]
    assert slot.attributes["calendar_id"] == 1
    assert hass.states.get(f"sensor.{HUB}_bookings_remaining").state == "2"


async def test_messages_sensor_skips_masked_system_mails(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    """The latest message is the newest one that is not a masked one-time code mail."""
    messages = hass.states.get(f"sensor.{HUB}_messages")
    assert messages.state == "2"
    assert messages.attributes["latest"]["subject"] == "Example maintenance notice"
    assert len(messages.attributes["messages"]) == 2


async def test_overview_includes_periods_and_prices(
    hass: HomeAssistant, init_integration: MockConfigEntry
) -> None:
    """The account overview carries the billing periods and the price list."""
    overview = hass.states.get(f"sensor.{HUB}_account_overview")
    assert overview.attributes["periods"] == load_sample("periods")["periods"]
    assert overview.attributes["prices"] == load_sample("prices")["groups"]


async def test_older_api_without_new_endpoints(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """An API version without the new endpoints still works, just without the extra sensors."""
    mock_api(aioclient_mock, legacy_api=True)
    mock_config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert hass.states.get(f"sensor.{HUB}_account_overview").state == "25.0"
    for key in ("next_bookable_slot", "bookings_remaining", "messages"):
        assert hass.states.get(f"sensor.{HUB}_{key}") is None
    assert hass.states.get(f"sensor.{HUB}_account_overview").attributes["prices"] == []


async def test_location_without_reservations_has_no_booking_sensors(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """When the API reports reservations as unavailable the booking sensors are not created."""
    calendar = {
        **load_sample("calendar"),
        "available": False,
        "calendars": [],
        "next_free_slot": None,
    }
    mock_api(aioclient_mock, extras={"calendar": calendar})
    mock_config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    assert hass.states.get(f"sensor.{HUB}_next_bookable_slot") is None
    assert hass.states.get(f"sensor.{HUB}_bookings_remaining") is None
    assert hass.states.get(f"sensor.{HUB}_messages").state == "2"


async def test_optional_failure_keeps_previous_data(
    hass: HomeAssistant,
    init_integration: MockConfigEntry,
    aioclient_mock: AiohttpClientMocker,
) -> None:
    """A failing optional endpoint neither fails the update nor wipes the last good value."""
    mock_api(aioclient_mock)
    aioclient_mock.get(f"{BASE_URL}/api/v1/calendar", status=500)
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=601))
    await hass.async_block_till_done()

    assert hass.states.get(f"sensor.{HUB}_account_overview").state == "25.0"
    assert hass.states.get(f"sensor.{HUB}_next_bookable_slot").state == expected_slot_start()
