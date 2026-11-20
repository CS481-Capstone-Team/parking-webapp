// Fake API routes. Each route reads or changes data.js and returns JSON,
// the same way the real server will.

import { http, HttpResponse } from "msw";
import { db, save, getPoolCount, HOST_ESTABLISHMENT_ID } from "./data.js";

// No login for the demo, so every Host request is treated as BellevueCollege's Host.
function hostPools() {
  return db.pools.filter((pool) => pool.establishmentId === HOST_ESTABLISHMENT_ID);
}

function hostSensors() {
  return db.sensors.filter((sensor) => sensor.establishmentId === HOST_ESTABLISHMENT_ID);
}

// Finds which pool a sensor is in, or null if it is in none.
function poolOfSensor(sensorId) {
  const pool = db.pools.find((p) => p.sensors.some((s) => s.sensorId === sensorId));
  return pool ? pool.id : null;
}

// What the Host sees for a pool: its settings plus the live count.
function toHostPool(pool) {
  return {
    id: pool.id,
    name: pool.name,
    capacity: pool.capacity,
    isPublic: pool.isPublic,
    sensors: pool.sensors,
    count: getPoolCount(pool),
  };
}

// What a Guest sees for a pool: availability (capacity minus cars inside), kept between 0 and capacity.
function toGuestPool(pool) {
  const open = pool.capacity - getPoolCount(pool);
  const available = Math.min(Math.max(open, 0), pool.capacity);
  return {
    id: pool.id,
    name: pool.name,
    capacity: pool.capacity,
    available,
    full: available === 0,
  };
}

// Sends back an error the page can show, e.g. { error: "Pool needs at least one in sensor." }
function error(status, message) {
  return HttpResponse.json({ error: message }, { status });
}

// Checks a new pool. Returns an error message, or null if it is fine.
function checkNewPool(body) {
  const { name, capacity, sensors } = body;

  if (typeof name !== "string" || name.trim() === "") {
    return "Pool needs a name.";
  }
  if (!Number.isInteger(capacity) || capacity < 1) {
    return "Capacity must be a whole number of at least 1.";
  }
  if (!Array.isArray(sensors)) {
    return "Pool needs a list of sensors.";
  }

  const seen = new Set();
  for (const { sensorId, role } of sensors) {
    if (!hostSensors().some((s) => s.id === sensorId)) {
      return `Sensor ${sensorId} does not exist.`;
    }
    if (seen.has(sensorId)) {
      return `Sensor ${sensorId} is added twice.`;
    }
    if (poolOfSensor(sensorId)) {
      return `Sensor ${sensorId} is already in another pool.`;
    }
    if (role !== "in" && role !== "out") {
      return `Sensor ${sensorId} must be "in" or "out".`;
    }
    seen.add(sensorId);
  }

  if (!sensors.some((s) => s.role === "in")) {
    return "Pool needs at least one in sensor.";
  }
  if (!sensors.some((s) => s.role === "out")) {
    return "Pool needs at least one out sensor.";
  }
  return null;
}

export const handlers = [
  // ---------- Host ----------

  // H-01: every sensor with its status, battery, and the pool it is in.
  http.get("/api/sensors", () => {
    const sensors = hostSensors().map((sensor) => ({
      id: sensor.id,
      online: sensor.online,
      battery: sensor.battery,
      poolId: poolOfSensor(sensor.id),
    }));
    return HttpResponse.json(sensors);
  }),

  // H-02: every car event from the Host's sensors. The page filters and sorts.
  http.get("/api/events", () => {
    const ids = hostSensors().map((s) => s.id);
    const events = db.events.filter((event) => ids.includes(event.sensorId));
    return HttpResponse.json(events);
  }),

  // H-04: every pool with its live count.
  http.get("/api/pools", () => {
    return HttpResponse.json(hostPools().map(toHostPool));
  }),

  // H-03: make a new pool. Body: { name, capacity, sensors: [{ sensorId, role }] }
  http.post("/api/pools", async ({ request }) => {
    const body = await request.json();
    const problem = checkNewPool(body);
    if (problem) {
      return error(400, problem);
    }

    const pool = {
      id: `pool-${Date.now()}`,
      establishmentId: HOST_ESTABLISHMENT_ID,
      name: body.name.trim(),
      capacity: body.capacity,
      isPublic: false,
      sensors: body.sensors.map(({ sensorId, role }) => ({ sensorId, role })),
      resetAt: new Date().toISOString(),
      resetCount: 0,
    };
    db.pools.push(pool);
    save();
    return HttpResponse.json(toHostPool(pool), { status: 201 });
  }),

  // H-06: change a pool. Body: { isPublic: true } or { isPublic: false }
  http.patch("/api/pools/:id", async ({ request, params }) => {
    const pool = hostPools().find((p) => p.id === params.id);
    if (!pool) {
      return error(404, "Pool not found.");
    }

    const body = await request.json();
    if (typeof body.isPublic !== "boolean") {
      return error(400, "isPublic must be true or false.");
    }

    pool.isPublic = body.isPublic;
    save();
    return HttpResponse.json(toHostPool(pool));
  }),

  // H-05: set a pool's count by hand. Body: { count: 12 }
  // Any whole number is accepted. The page is the one that stops negative numbers.
  http.post("/api/pools/:id/count", async ({ request, params }) => {
    const pool = hostPools().find((p) => p.id === params.id);
    if (!pool) {
      return error(404, "Pool not found.");
    }

    const body = await request.json();
    if (!Number.isInteger(body.count)) {
      return error(400, "count must be a whole number.");
    }

    // The count starts again from this number. Only events after resetAt are added to it.
    pool.resetAt = new Date().toISOString();
    pool.resetCount = body.count;
    save();
    return HttpResponse.json(toHostPool(pool));
  }),

  // ---------- Guest ----------

  // G-01: establishments whose name contains the search text. No text returns all.
  http.get("/api/establishments", ({ request }) => {
    const search = (new URL(request.url).searchParams.get("name") || "").toLowerCase();
    const matches = db.establishments
      .filter((e) => e.name.toLowerCase().includes(search))
      .map((e) => ({ id: e.id, name: e.name }));
    return HttpResponse.json(matches);
  }),

  // G-02 to G-04: an establishment's public pools with their availability.
  http.get("/api/establishments/:id/pools", ({ params }) => {
    const establishment = db.establishments.find((e) => e.id === params.id);
    if (!establishment) {
      return error(404, "Establishment not found.");
    }

    const pools = db.pools
      .filter((pool) => pool.establishmentId === establishment.id && pool.isPublic)
      .map(toGuestPool);
    return HttpResponse.json(pools);
  }),
];
