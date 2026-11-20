// Functions to get data from the server. Pages call these instead of fetch.
// In `npm run dev`, the fake server in mocks/ answers. With `npm run dev:server`, the real one does.

if (import.meta.env.MODE === "development") {
  const { startMocks } = await import("../mocks/browser.js");
  await startMocks();
}

// Sends a request and returns the JSON reply.
// If the server says no (e.g. a pool without an "in" sensor), throws an Error with its message.
async function request(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

// ---------- Host ----------

// H-01: [{ id, online, battery, poolId }]. poolId is null if the sensor is in no pool.
export function getSensors() {
  return request("GET", "/api/sensors");
}

// H-02: [{ id, sensorId, timestamp, direction, speed }]. Every event. Filter and sort on the page.
export function getEvents() {
  return request("GET", "/api/events");
}

// H-04: [{ id, name, capacity, isPublic, sensors, count }]. count can go below 0 or over capacity.
export function getPools() {
  return request("GET", "/api/pools");
}

// H-03: pool = { name, capacity, sensors: [{ sensorId, role: "in" | "out" }] }. Returns the new pool.
export function createPool(pool) {
  return request("POST", "/api/pools", pool);
}

// H-06: show or hide a pool for Guests. Returns the updated pool.
export function setPoolPublic(poolId, isPublic) {
  return request("PATCH", `/api/pools/${poolId}`, { isPublic });
}

// H-05: sets a pool's count to a number. Returns the updated pool.
// The server accepts any whole number, so the page should stop negative numbers.
export function setPoolCount(poolId, count) {
  return request("POST", `/api/pools/${poolId}/count`, { count });
}

// ---------- Guest ----------

// G-01: [{ id, name }] whose name contains the search text. Empty text returns all.
export function searchEstablishments(name) {
  return request("GET", `/api/establishments?name=${encodeURIComponent(name)}`);
}

// G-02 to G-04: [{ id, name, capacity, available, full }]. Public pools only.
export function getEstablishmentPools(establishmentId) {
  return request("GET", `/api/establishments/${establishmentId}/pools`);
}
