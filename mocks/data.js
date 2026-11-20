// Fake database. Holds establishments, sensors, pools, and events.
// Saved in localStorage so changes survive a page reload.

import pastEvents from "./events.json";

// No login for the demo, so the Host is always BellevueCollege's.
export const HOST_ESTABLISHMENT_ID = "est-1";

const STORAGE_KEY = "parking-mock-db";

// The data the app starts with. Used the first time, or after localStorage is cleared.
function seed() {
  const now = new Date().toISOString();

  return {
    establishments: [
      { id: "est-1", name: "BellevueCollege" },
      { id: "est-2", name: "Westfield Mall" },
      { id: "est-3", name: "City Library" },
      { id: "est-4", name: "Riverside Stadium" },
    ],

    // Only BellevueCollege has sensors.
    sensors: [
      { id: "sensor-1", establishmentId: "est-1", online: true, battery: 87 },
      { id: "sensor-2", establishmentId: "est-1", online: true, battery: 64 },
    ],

    pools: [
      // The real pool. Its count comes from sensor-1 and sensor-2 events.
      // resetAt is far in the past so every past event counts.
      {
        id: "pool-1",
        establishmentId: "est-1",
        name: "RoomA109",
        capacity: 20,
        isPublic: true,
        sensors: [
          { sensorId: "sensor-1", role: "in" },
          { sensorId: "sensor-2", role: "out" },
        ],
        resetAt: "1970-01-01T00:00:00Z",
        resetCount: 0,
      },

      // Placeholder pools with no sensors. Their count stays at resetCount.
      { id: "pool-2", establishmentId: "est-2", name: "Garage A", capacity: 300, isPublic: true, sensors: [], resetAt: now, resetCount: 180 },
      { id: "pool-3", establishmentId: "est-2", name: "Garage B", capacity: 150, isPublic: true, sensors: [], resetAt: now, resetCount: 42 },
      { id: "pool-4", establishmentId: "est-2", name: "Staff Lot", capacity: 40, isPublic: false, sensors: [], resetAt: now, resetCount: 25 }, // private: Guests must not see it
      { id: "pool-5", establishmentId: "est-3", name: "Main Lot", capacity: 60, isPublic: true, sensors: [], resetAt: now, resetCount: 60 },   // full
      { id: "pool-6", establishmentId: "est-4", name: "Lot C", capacity: 500, isPublic: true, sensors: [], resetAt: now, resetCount: 310 },
    ],

    // Past events from events.json, numbered 1, 2, 3, ... in time order.
    events: pastEvents.map((event, i) => ({ id: i + 1, ...event })),
  };
}

// Loads saved data, or starts fresh from the seed.
function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : seed();
}

// The fake database. handlers.js and cars.js read and change it directly.
export const db = load();

// Writes the database to localStorage. Call after every change.
export function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function getPool(id) {
  return db.pools.find((pool) => pool.id === id);
}

// A pool's count is not stored. It is worked out from events:
// resetCount + "in" events - "out" events, for events after resetAt.
// A sensor's role in the pool decides in or out, not the event's direction.
export function getPoolCount(pool) {
  const resetTime = new Date(pool.resetAt).getTime();
  let count = pool.resetCount;

  for (const event of db.events) {
    const member = pool.sensors.find((s) => s.sensorId === event.sensorId);
    if (!member) continue;
    if (new Date(event.timestamp).getTime() <= resetTime) continue;
    count += member.role === "in" ? 1 : -1;
  }
  return count;
}

// Saves a batch of new events, numbering them after the last one.
export function addEvents(events) {
  let nextId = db.events.length > 0 ? db.events[db.events.length - 1].id + 1 : 1;
  for (const event of events) {
    db.events.push({ id: nextId++, ...event });
  }
  save();
}

save();
