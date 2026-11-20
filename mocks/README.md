# Mocks

A fake server that runs in the browser using MSW (Mock Service Worker). It answers the same API requests the real server will, so the app can be built and tested without the server or sensors.

When the real server is ready, the mocks are turned off. Code in `app/` does not change.

## Files

| File | What it does |
| --- | --- |
| `data.js` | Fake data: establishments, sensors, pools, and events. Saved in `localStorage`. |
| `events.json` | 60 days of past car events for `sensor-1` and `sensor-2`. Made by `scripts/generate_events.py`. |
| `handlers.js` | Fake API routes. Each one reads or changes `data.js` and returns JSON. |
| `cars.js` | Adds a fake car every 2–6 seconds while the app is open. |
| `browser.js` | Starts MSW. |
| `scripts/generate_events.py` | Builds `events.json`. |

## Fake data

| Establishment | Pool | Capacity | Public | Sensors |
| --- | --- | --- | --- | --- |
| BellevueCollege | RoomA109 | 20 | Yes | `sensor-1` in, `sensor-2` out |

Other establishments and pools are placeholders with fixed counts, so Guest search has something to find.

A pool's count is `resetCount + ins - outs`, for events after `resetAt`. Pools with no sensors stay at `resetCount`.

## Fake cars

- A car arrives every 2–6 seconds.
- Chance it is coming in: `1 - count / capacity`. Empty lot: always in. Full lot: always out.
- In cars are events on `sensor-1`, out cars on `sensor-2`.
- Speed: 5–15 mph.

## Events

Each event:

```json
{ "sensorId": "sensor-1", "timestamp": "2026-09-21T14:20:54Z", "direction": "in", "speed": 8.7 }
```

- `timestamp` is UTC.
- `direction` is `in` or `out`.
- Cars are not tracked. An in and a later out are not linked to the same car.

## Regenerate past events

From the `parking-webapp` folder:

```
python mocks/scripts/generate_events.py
```

Options: `--days 60`, `--capacity 20`, `--seed 1`.

- 30–50 cars a day, busiest around 12:30, quiet at night.
- Each car stays 15 minutes to 4 hours. The lot empties every night.
- The count never goes below 0 or above capacity. Cars that arrive when the lot is full are turned away.
- The count at the end is where `cars.js` starts.

After regenerating, clear `localStorage` in the browser so the new events load.

## API

| Method | URL | Returns |
| --- | --- | --- |
| GET | `/api/sensors` | All sensors with status and battery. |
| GET | `/api/events` | All events. Filter and sort in the browser. |
| GET | `/api/pools` | All of the Host's pools with their live count. |
| POST | `/api/pools` | Creates a pool. `400` if it has no in or no out sensor, or a sensor is already in a pool. |
| PATCH | `/api/pools/:id` | Changes a pool (e.g. public on or off). |
| POST | `/api/pools/:id/count` | Sets a pool's count. Body: `{ count }`. Any whole number. |
| GET | `/api/establishments?name=` | Establishments whose name matches. |
| GET | `/api/establishments/:id/pools` | That establishment's public pools. Availability (capacity minus cars inside) kept between 0 and capacity. |

Pages get live data by calling these again every few seconds.
