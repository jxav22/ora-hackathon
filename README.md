# Ora — Aave NZD Sepolia Demo

[Scaffold-ETH 2](https://scaffoldeth.io) monorepo for **Ora**: a Sepolia demo of a private Aave V3 market with **wETH**, **wBTC**, and **dNZD** (demo NZD stable, 6 decimals), plus a Binance-powered borrow risk API.

> **New here?** Start with [docs/HANDOVER.md](docs/HANDOVER.md) — verified live state, day-one blockers, and the path from prototype to product.

## Repo layout

| Path | Role |
| :--- | :--- |
| [`packages/nextjs`](packages/nextjs) | Ora frontend + `/api/v1/*` (Next.js, RainbowKit/Privy, Wagmi, Viem) |
| [`aave-v3-origin`](aave-v3-origin) | Vendored Aave V3 Foundry tree + hackathon market deploy scripts |
| [`packages/hardhat`](packages/hardhat) | Stock SE-2 boilerplate — **not** used for the Sepolia market |

Live market addresses are copied into [`packages/nextjs/config/hackathon-market.json`](packages/nextjs/config/hackathon-market.json) after a Foundry deploy. **dNZD** is a mock stand-in — not production NewMoney / NZDD.

## What ships

| Surface | Route | Notes |
| :--- | :--- | :--- |
| **Landing** | `/` | Ora home — earn NZD vs borrow against crypto |
| **Your account** | `/app` | Primary product UI: overview, earn, borrow |
| **Rates & risk** | `/market` | Market rates and risk framing |
| **Advanced panel** | `/advanced` | Lower-level supply/borrow/repay panel (`/mnzd` redirects here) |
| **Public REST API** | `/api/v1/*` | OpenAPI at `/api/v1/openapi.json` — [docs/API.md](docs/API.md) |
| **Developer playground** | `/developer-api` | Interactive forms over the v1 API |
| **API Agent** | `/binance-chat` | LLM over the same routes (`OPENAI_API_KEY`) |
| Official Aave EURS | `/aave` | Reference only — not in primary nav |

## Quickstart (frontend on Sepolia)

### Requirements

- [Node.js >= 22.10.0](https://nodejs.org/en/download/)
- [Yarn 4](https://yarnpkg.com/getting-started/install) (this repo uses `packageManager: yarn@4.13.0`)
- [Git](https://git-scm.com/downloads)
- A browser wallet on **Ethereum Sepolia** (`11155111`)

### Run

```bash
yarn install

# Optional but recommended — packages/nextjs/.env.local
#   ALCHEMY_API_KEY=...
#   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=...
#   OPENAI_API_KEY=...          # only for /binance-chat
#   OPENAI_MODEL=gpt-4o-mini    # optional

yarn start
```

Open **http://localhost:3000** (account UI at `/app`).

Defaults for Alchemy and WalletConnect exist in `scaffold.config.ts` for prototyping; use your own keys for anything shared or public.

You do **not** need `yarn chain` / `yarn deploy` for product work against the live Sepolia market.

### Useful checks

```bash
yarn test:aave                          # Vitest (config, amounts, API, risk)
yarn next:check-types
yarn next:lint
cd packages/nextjs && yarn risk:smoke   # live position + Binance + stress engine
yarn aave:smoke                         # read-only official EURS market
```

Opt-in write e2e (needs a funded key that can mint dNZD):

```bash
AAVE_E2E=1 E2E_PRIVATE_KEY=0x… yarn aave:e2e
```

## Market deploy (`aave-v3-origin`)

The custom Pool / oracles / listing live under [`aave-v3-origin`](aave-v3-origin) (Foundry). Full runbook: [aave-v3-origin/docs/HACKATHON_MARKET.md](aave-v3-origin/docs/HACKATHON_MARKET.md).

```bash
cd aave-v3-origin
# Needs Foundry + RPC / key in .env (see .env.example)

forge test --match-path tests/hackathon/HackathonMarket.t.sol -vv

forge script scripts/DeployHackathonMarket.sol:DeployHackathonMarket \
  --rpc-url sepolia --broadcast
```

After deploy, copy `reports/hackathon-market.json` → `packages/nextjs/config/hackathon-market.json`.

Client field notes: [aave-v3-origin/docs/CLIENT_HANDOFF.md](aave-v3-origin/docs/CLIENT_HANDOFF.md).

## Day-one reality check

As of the last live reconciliation ([HANDOVER §2](docs/HANDOVER.md#2-verified-live-state)):

- **wETH / wBTC** use fixed NZD settable mocks (NZ$3,090 / NZ$106,526); **dNZD** is a constant NZ$1 mock.
- Crypto collateral has been supplied by the admin; **dNZD pool liquidity was 0**, so borrows revert until someone supplies dNZD.
- Minting dNZD / wBTC is **owner-only**.

## Documentation

| Doc | Use it for |
| :--- | :--- |
| [docs/HANDOVER.md](docs/HANDOVER.md) | **Canonical** live market state, blockers, repo map, product gaps |
| [docs/AAVE_HACKATHON_MNZD.md](docs/AAVE_HACKATHON_MNZD.md) | Market UI runbook, assets, e2e |
| [docs/BORROW_RISK_ASSISTANT.md](docs/BORROW_RISK_ASSISTANT.md) | Risk methodology, seeding, demo script |
| [docs/API.md](docs/API.md) | Public API v1 |
| [docs/AAVE_SEPOLIA.md](docs/AAVE_SEPOLIA.md) | Official EURS reference path (`/aave`) |
| [docs/WEB2_HANDOFF.md](docs/WEB2_HANDOFF.md) | Web2 → web3 onboarding |
| [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md) | Product framing / pitch honesty — **addresses superseded by HANDOVER** |
| [aave-v3-origin/docs/HACKATHON_MARKET.md](aave-v3-origin/docs/HACKATHON_MARKET.md) | Foundry deploy / listing |
| [Scaffold-ETH 2 docs](https://docs.scaffoldeth.io) | SE-2 hooks, components, local Hardhat workflow |

## Local Hardhat playground (optional)

Unrelated to the Sepolia Aave demo:

```bash
yarn chain      # local chain
yarn deploy     # stock YourContract only
yarn start
```

## Deploy frontend

```bash
yarn vercel:yolo --prod
```

Do not expose `OPENAI_API_KEY` on a public deploy without gating `POST /api/v1/binance/chat` — CORS is open on the v1 API.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). For agent / AI guidance, see [AGENTS.md](AGENTS.md).
