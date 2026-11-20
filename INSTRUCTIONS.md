# Instructions

Work only inside `app/`. Everything outside it is set up for you.

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

Guest page showing the first pool's name.

`app/guest/index.html` (makes the page):
```html
<link rel="stylesheet" href="/style.css">
<h1>Parking</h1>
<div id="pools"></div>
<script type="module" src="./main.js"></script>
```

`app/guest/main.js` (logic, gets data from `api.js`):
```js
import { getGuestPools } from "../api.js";

const pools = await getGuestPools();
document.getElementById("pools").textContent = pools[0].name;
```

## Rules

- Page layout goes in the HTML file.
- Logic goes in `main.js`.
- Styles go in `app/style.css`.
- Data only comes from `app/api.js`. Use it, do not edit it.
- While mocks are on, `app/api.js` gets fake data from `mocks/`. Later it gets real data from the server. Your code does not change.
- Host and Guest are separate. They share only `app/api.js` and `app/style.css`.
- Do not edit anything outside `app/`.
