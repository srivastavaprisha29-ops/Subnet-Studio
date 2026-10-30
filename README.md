# Subnet Studio

An interactive IPv4 subnetting practice lab for Computer Networks preparation. Work through a question, check answers as you type, and reveal the reasoning one step at a time.

[Open the private hosted lab](https://subnet-studio-prisha-3ec21a.saltylake.chatgpt.site)

The hosted lab is restricted to its owner through ChatGPT sign-in. This public repository contains the application source; it does not grant access to that deployment. Access control is provided by the hosting platform, not by the static application. Hosting these files elsewhere requires that host's own access controls if privacy is needed.

## Features

- CIDR ↔ subnet-mask conversion and address-capacity exercises.
- Network, broadcast, first/last usable host, total-address, and usable-host calculations.
- Color-coded 32-bit diagrams that distinguish fixed network bits from variable host bits, plus aligned address blocks.
- A custom-address bit explorer with a /8–/30 prefix slider.
- Equal Class B subnet splitting, inclusive ranges across octets, CIDR alignment, and small VLSM allocations.
- Seven familiar examples, generated practice by topic, hints, progressive worked steps, and immediate answer feedback.
- A quick reference and browser-local solved count and streak. Streaks count questions completed without submitted mistakes, hints, or revealed steps.

Examples include `192.168.1.10/24`, `167.199.170.82/27`, dividing a Class B `/16` into four `/18` subnets, and counting `146.102.29.0` through `146.102.32.255`.

## Run locally

No build step or JavaScript dependencies are required. With Python 3 installed:

```sh
git clone https://github.com/srivastavaprisha29-ops/Subnet-Studio.git
cd Subnet-Studio
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Open <http://localhost:8000>. Serve the files over HTTP rather than opening `index.html` directly, because the app uses ES modules. Assets use relative paths, so the app also works beneath a hosting subdirectory.

## Validation

With Node.js 20 or later:

```sh
node test.mjs
```

Or use `npm test`. No `npm install` is needed.

The test suite covers known answers, every supported prefix `/0`–`/30`, 1,000 addresses checked against an independent BigInt bit-mask implementation, 600 generated question sets, input validation, and VLSM capacity/non-overlap. Desktop and narrow-screen practice flows were also checked in a browser.

## Files

| File | Purpose |
| --- | --- |
| `dist/index.html` | Practice, explorer, and reference views |
| `dist/styles.css` | Responsive layout and bit/block diagrams |
| `dist/core.mjs` | IPv4 arithmetic, question generation, and answer validation |
| `dist/app.mjs` | UI state, feedback, diagrams, and local progress |
| `test.mjs` | Deterministic calculation and generated-question checks |

## Calculation scope

For conventional IPv4 subnets, a prefix of `p` leaves `32 − p` host bits. Total addresses are `2^(32 − p)`, and usable hosts are total minus the network and broadcast addresses. The calculation engine supports `/0`–`/30`; `/31` point-to-point links and `/32` host routes are explicitly outside this lab.

Class B questions explicitly start at `/16`; ordinary CIDR questions use their stated prefix. Range questions distinguish a smallest covering CIDR block from an exact CIDR range. VLSM questions use largest-first allocation with the smallest fitting conventional subnet.

Progress is saved in `localStorage` for the current browser and origin, without cross-device sync. The app has no external assets, analytics, application API calls, or backend dependencies. No public web deployment is configured by this repository.
