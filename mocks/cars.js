// Fake cars. Every 10 seconds, saves a batch of 0-6 car events,
// like the real server does when it asks each sensor for its events on every heartbeat.

import { getPool, getPoolCount, addEvents } from "./data.js";

const POOL_ID = "pool-1";        // RoomA109: sensor-1 is "in", sensor-2 is "out"
const HEARTBEAT_MS = 10_000;     // how often a batch is saved
const MAX_CARS_PER_BATCH = 6;
const WRONG_WAY_CHANCE = 0.02;   // sometimes a car drives the wrong way over a sensor

// Random whole number from min to max, both included.
function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Random number from min to max, rounded to 1 decimal.
function randomDecimal(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

// Makes one batch of cars that passed during the last heartbeat.
function makeBatch() {
  const pool = getPool(POOL_ID);
  let count = getPoolCount(pool);
  const now = Date.now();

  // Each car gets a random time in the last 10 seconds, oldest first.
  const carCount = randomInt(0, MAX_CARS_PER_BATCH);
  const times = [];
  for (let i = 0; i < carCount; i++) {
    times.push(now - Math.random() * HEARTBEAT_MS);
  }
  times.sort((a, b) => a - b);

  const batch = [];
  for (const time of times) {
    // The fuller the lot, the more likely the car is leaving.
    // Empty lot: always in. Full lot: always out.
    const comingIn = Math.random() < 1 - count / pool.capacity;
    count += comingIn ? 1 : -1;

    let direction = comingIn ? "in" : "out";
    if (Math.random() < WRONG_WAY_CHANCE) {
      direction = comingIn ? "out" : "in";
    }

    batch.push({
      sensorId: comingIn ? "sensor-1" : "sensor-2",
      timestamp: new Date(time).toISOString(),
      direction,
      speed: randomDecimal(5, 15),
    });
  }
  return batch;
}

// Starts saving a batch every heartbeat. Called once by browser.js.
export function startCars() {
  setInterval(() => {
    const batch = makeBatch();
    if (batch.length > 0) {
      addEvents(batch);
    }
  }, HEARTBEAT_MS);
}
