"""Generate fake car events for the past N days.

Writes mocks/events.json: a list of events sorted by time.
Each event: { sensorId, timestamp, direction, speed }.

sensor-1 is the "in" sensor, sensor-2 is the "out" sensor.
The running count (ins - outs) never goes below 0 or above capacity.
The count at the end is where the live mock (cars.js) starts.

Usage:
    python mocks/scripts/generate_events.py
    python mocks/scripts/generate_events.py --days 30 --capacity 20 --seed 1
"""

import argparse
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUT_FILE = Path(__file__).resolve().parent.parent / "events.json"

PEAK_HOUR = 12.5       # busiest time of day (12:30)
SPREAD_HOURS = 2.5     # width of the bell curve
CARS_PER_DAY = (30, 50)
STAY_HOURS = (0.25, 4)
SPEED_MPH = (5, 15)
WRONG_WAY_CHANCE = 0.02


def make_event(sensor_id, time, direction):
    if random.random() < WRONG_WAY_CHANCE:
        direction = "out" if direction == "in" else "in"
    return {
        "sensorId": sensor_id,
        "timestamp": time.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "direction": direction,
        "speed": round(random.uniform(*SPEED_MPH), 1),
    }


def generate_day(day_start, capacity):
    """One day of cars. Every car that comes in leaves the same day."""
    day_end = day_start + timedelta(days=1) - timedelta(minutes=1)
    visits = []
    for _ in range(random.randint(*CARS_PER_DAY)):
        hour = min(max(random.gauss(PEAK_HOUR, SPREAD_HOURS), 0), 23.5)
        arrive = day_start + timedelta(hours=hour)
        leave = min(arrive + timedelta(hours=random.uniform(*STAY_HOURS)), day_end)
        visits.append((arrive, leave))
    visits.sort()

    # Turn away cars that arrive when the lot is full.
    accepted = []
    for arrive, leave in visits:
        inside = sum(1 for a, l in accepted if a <= arrive < l)
        if inside < capacity:
            accepted.append((arrive, leave))
    return accepted


def generate_events(days, capacity, now=None):
    now = now or datetime.now().astimezone()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    events = []
    for i in range(days - 1, -1, -1):
        for arrive, leave in generate_day(today - timedelta(days=i), capacity):
            # Drop anything that hasn't happened yet today.
            if arrive <= now:
                events.append((arrive, make_event("sensor-1", arrive, "in")))
            if leave <= now:
                events.append((leave, make_event("sensor-2", leave, "out")))

    events.sort(key=lambda e: e[0])
    return [event for _, event in events]


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--days", type=int, default=60)
    parser.add_argument("--capacity", type=int, default=20)
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    events = generate_events(args.days, args.capacity)
    OUT_FILE.write_text(json.dumps(events, indent=2) + "\n")

    count = sum(1 if e["sensorId"] == "sensor-1" else -1 for e in events)
    print(f"Wrote {len(events)} events to {OUT_FILE}")
    print(f"Current count: {count} / {args.capacity}")


if __name__ == "__main__":
    main()
