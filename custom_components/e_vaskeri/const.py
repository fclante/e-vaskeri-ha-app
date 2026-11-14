"""Constants for the E-Vaskeri integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "e_vaskeri"
MANUFACTURER: Final = "E-Vaskeri"
DEFAULT_HUB_NAME: Final = "E-Vaskeri"

CONF_MACHINES_INTERVAL: Final = "machines_interval"
CONF_ACCOUNT_INTERVAL: Final = "account_interval"

DEFAULT_MACHINES_INTERVAL: Final = 30
MIN_MACHINES_INTERVAL: Final = 10
DEFAULT_ACCOUNT_INTERVAL: Final = 600
MIN_ACCOUNT_INTERVAL: Final = 60
MAX_INTERVAL: Final = 86400

REQUEST_TIMEOUT: Final = 15
STATEMENT_LIMIT: Final = 15
STATS_MONTHS: Final = 12
PERIODS_LIMIT: Final = 12
MESSAGES_LIMIT: Final = 5

EVENT_CYCLE_FINISHED: Final = "e_vaskeri_cycle_finished"
CYCLE_FINISHED_EVENT_TYPE: Final = "cycle_finished"

STATE_FREE: Final = "free"
STATE_BUSY: Final = "busy"
STATE_DONE: Final = "done"
STATE_ERROR: Final = "error"
STATE_UNKNOWN: Final = "unknown"
MACHINE_STATES: Final = [STATE_FREE, STATE_BUSY, STATE_DONE, STATE_ERROR, STATE_UNKNOWN]

CARD_URL_PATH: Final = f"/{DOMAIN}/e-vaskeri-card.js"
