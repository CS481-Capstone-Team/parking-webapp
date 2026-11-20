# Instructions

## How a page works

Each page is built from three places:

1. **The HTML file makes the page.** It holds what you see: headings, empty boxes, buttons. Give anything you will fill in an `id`.
2. **`main.js` holds the logic.** It finds those elements by their `id`, asks for data, and puts the data on the page.
3. **`src/api.js` gets the data.** `main.js` never talks to the server itself. It calls a function from `api.js` and gets the data back.

| Page | Makes the page | Logic |
| --- | --- | --- |
| Host (`/host/`) | `host/index.html` | `src/host/main.js` |
| Guest (`/guest/`) | `guest/index.html` | `src/guest/main.js` |

Both pages get their data from `src/api.js`.

## Example

Guest page showing the first pool's name.

`guest/index.html` (makes the page):
```html
<h1>Parking</h1>
<div id="pools"></div>
<script type="module" src="/src/guest/main.js"></script>
```

`src/guest/main.js` (logic, gets data from `api.js`):
```js
import { getGuestPools } from "../api.js";

const pools = await getGuestPools();
document.getElementById("pools").textContent = pools[0].name;
```

## Rules

- Page layout goes in the HTML file.
- Logic goes in `main.js`.
- Data only comes from `src/api.js`.
- While mocks are on, `src/api.js` gets fake data from `mocks/`. Later it gets real data from the server. Your code does not change.
- Host and Guest are separate. They share only `src/api.js` and `src/style.css`.
- Do not edit `mocks/` or `public/mockServiceWorker.js`.
