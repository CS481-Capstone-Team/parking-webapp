# Instructions

All work on the pages is done in `app/`. To add more mock data or change how the fake server responds, see `mocks/`, but that should rarely be necessary for now.

## Pages

| Page | URL | Makes the page | Logic |
| --- | --- | --- | --- |
| Start | `/` | `app/index.html` | none, just two links |
| Host | `/host/` | `app/host/index.html` | `app/host/main.js` |
| Guest | `/guest/` | `app/guest/index.html` | `app/guest/main.js` |

The Start page asks "I am a Guest" or "I am a Host" and links to the right page.

## How a page works

Each page is built from three places:

1. **The HTML file makes the page.** It holds what you see: headings, empty boxes, buttons. Give anything you will fill in an `id`.
2. **`main.js` holds the logic.** It finds those elements by their `id`, asks for data, and puts the data on the page.
3. **`app/api.js` gets the data.** `main.js` never talks to the server itself. It calls a function from `api.js` and gets the data back.

Styles for every page go in `app/style.css`.

## Example

Host page showing the first pool's count, updated every 3 seconds.

`app/host/index.html` (makes the page):
```html
<link rel="stylesheet" href="/style.css">
<h1>Host</h1>
<div id="count"></div>
<script type="module" src="./main.js"></script>
```

`app/host/main.js` (logic, gets data from `api.js`):
```js
import { getPools } from "../api.js";

async function showCount() {
  const pools = await getPools();
  document.getElementById("count").textContent =
    `${pools[0].name}: ${pools[0].count} / ${pools[0].capacity}`;
}

showCount();                   // show it right away
setInterval(showCount, 3000);  // then ask again every 3 seconds
```

Live data works this way: ask again every few seconds.

## Functions in `api.js`

| Function | For |
| --- | --- |
| `getSensors()` | Host: sensors with status and battery |
| `getEvents()` | Host: every car event |
| `getPools()` | Host: pools with their count |
| `createPool({ name, capacity, sensors })` | Host: make a pool |
| `setPoolPublic(poolId, isPublic)` | Host: show or hide a pool for Guests |
| `resetPool(poolId)` | Host: set a pool's count to 0 |
| `searchEstablishments(name)` | Guest: find establishments by name |
| `getEstablishmentPools(establishmentId)` | Guest: an establishment's public pools |

If the server says no (e.g. a pool without an "in" sensor), the function throws an error. Show its message with `try { ... } catch (err) { ... err.message ... }`.

## Rules

- Page layout goes in the HTML file.
- Logic goes in `main.js`.
- Styles go in `app/style.css`.
- Data only comes from `app/api.js`. Use it, do not edit it.
- While mocks are on, `app/api.js` gets fake data from `mocks/`. Later it gets real data from the server. Your code does not change.
- Host and Guest are separate. They share only `app/api.js` and `app/style.css`.
- Mock data and fake server responses are in `mocks/`.
