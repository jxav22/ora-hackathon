"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { Card, Eyebrow, Skeleton, Stat } from "~~/components/ora/primitives";
import { useHackathonMarket } from "~~/hooks/aave/useHackathonMarket";
import { isPrivyEnabled } from "~~/utils/auth/isPrivyEnabled";
import { formatBase, formatNzd, formatPercent } from "~~/utils/format/money";
import { getPublicContactEmail } from "~~/utils/site/contactEmail";

/**
 * Landing page.
 *
 * Written for a platform or an issuer first: idle NZD float, what happens to a loan and to the
 * pool when prices fall, then the people and funds who borrow against crypto. Integration and a
 * direct contact path sit at the end, because that is how a platform actually starts.
 */

const PLATFORM_USES = [
  { title: "Custody float", detail: "Between transactions" },
  { title: "Distribution pools", detail: "Between payouts" },
  { title: "Escrow capital", detail: "In transit" },
];

const POSITION_ROWS = [
  { move: "Nothing changes", hf: "1.60", tone: "text-[var(--pine)]" },
  { move: "A typical day's movement", hf: "1.56", tone: "text-[var(--pine)]" },
  { move: "Its worst fall in the last month", hf: "1.44", tone: "text-[var(--pine)]" },
  { move: "25%", hf: "1.20", tone: "text-[var(--clay)]" },
  { move: "40%", hf: "0.96", tone: "text-destructive" },
];

const Landing: NextPage = () => {
  return (
    <>
      <Hero />
      <PlatformSection />
      <StressSection />
      <BorrowSection />
      <IntegrationSection />
      <ContactSection />
      <Footnote />
    </>
  );
};

export default Landing;

/**
 * The hero fills the first screen and centres in it.
 *
 * Height is measured in `svh`, not `vh`, because on a phone `100vh` is the viewport with the
 * browser chrome hidden, which is taller than what is actually visible on load and cuts the
 * bottom off. `svh` is the smallest viewport, so the hero fits whether the chrome is showing
 * or not. The offset is the sticky header plus the prototype bar. Padding is symmetric so the
 * centring is true rather than optically low, and the height is a minimum, so on a short
 * screen the content grows and scrolls instead of clipping.
 */
const Hero = () => (
  <section className="relative flex min-h-[calc(100svh-7rem)] items-center overflow-hidden lg:min-h-[calc(100svh-6.25rem)]">
    <div className="grain container-page grid w-full gap-10 py-[clamp(1.5rem,4svh,3rem)] lg:grid-cols-[1.15fr_1fr] lg:gap-12">
      <div>
        <Eyebrow>Aotearoa New Zealand</Eyebrow>
        {/*
          Sized from the space it has to live in rather than from width breakpoints. The headline
          is three lines, so its height is what decides whether the hero clears the fold, and a
          1366x768 laptop is wide enough for the largest width breakpoint while being far too
          short for it. `svh` tracks the height, `vw` keeps the longer lines inside a narrow
          phone, and the rem bounds keep it legible and respect the user's own font size.
        */}
        <h1 className="mt-4 font-display text-[clamp(1.65rem,min(7.5svh,8vw),5rem)] leading-[1.02] tracking-[-0.02em]">
          The yield layer
          <br />
          for New Zealand
          <br />
          <em className="text-[var(--pine)]">dollar stablecoins.</em>
        </h1>
        <p className="mt-6 max-w-xl leading-relaxed text-muted-foreground sm:text-lg">
          Platforms and issuers hold NZD stablecoin balances that earn nothing. Ora is where that float goes to work,
          non-custodially, denominated in <span className="text-foreground">New Zealand dollars</span> throughout.
          Nearly every way to earn on-chain is priced in US dollars, so putting a balance to work that way creates a
          currency position nobody chose. This site is a Sepolia testnet prototype. It uses demo NZD (dNZD) and test ETH
          and Bitcoin on an Aave V3 market, not bank deposits.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--pine-deep)]"
          >
            Talk to us
            <span aria-hidden>→</span>
          </a>
          <a
            href="#integration"
            className="inline-flex items-center gap-2 rounded-full border border-input px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            How a platform plugs in
          </a>
        </div>
      </div>

      <HeroCard />
    </div>
  </section>
);

const HeroCard = () => {
  const { bySymbol, isLoading } = useHackathonMarket();
  const nzd = bySymbol.dNZD;
  const eth = bySymbol.wETH;

  return (
    <div className="relative lg:pt-6">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_top,var(--paper),transparent_65%)]" />
      <Card className="relative overflow-hidden">
        <div className="flex items-baseline justify-between">
          <Eyebrow>The NZD market</Eyebrow>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--pine)]">Sepolia</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <Stat
            label="Yield on NZD"
            value={isLoading ? <Skeleton className="h-7 w-20" /> : formatPercent(nzd?.supplyApyPercent ?? 0)}
            accent
            hint="Paid by borrowers"
          />
          <Stat
            label="Borrow NZD at"
            value={isLoading ? <Skeleton className="h-7 w-20" /> : formatPercent(nzd?.borrowApyPercent ?? 0)}
            hint="Variable rate"
          />
          <Stat
            label="Deposited"
            value={
              isLoading || !nzd ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                formatNzd(nzd.totalSupplied, nzd.decimals, { decimals: 0 })
              )
            }
            hint="Across the market"
          />
          <Stat
            label="Borrow up to"
            value={isLoading ? <Skeleton className="h-7 w-16" /> : formatPercent(eth?.maxLtvPercent ?? 0, 0)}
            hint="Of the collateral"
          />
        </div>

        <div className="hairline mt-8 pt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>How much of the pool is lent out</span>
            <span className="tabular font-mono text-foreground">
              {isLoading ? "-" : formatPercent(nzd?.utilisationPercent ?? 0, 1)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-[var(--pine)] transition-[width] duration-500"
              style={{ width: `${Math.min(100, nzd?.utilisationPercent ?? 0)}%` }}
            />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            The more of the pool that is lent, the more interest flows to the balances deposited in it. The rate moves
            with that. A balance can be withdrawn only while the pool still holds the funds.
          </p>
        </div>
      </Card>
    </div>
  );
};

const PlatformSection = () => {
  const { bySymbol, isLoading } = useHackathonMarket();
  const nzd = bySymbol.dNZD;

  return (
    <section className="container-page pb-24">
      <div className="grid gap-10 rounded-2xl border border-border bg-card p-8 shadow-card lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
        <div>
          <Eyebrow>For platforms and issuers</Eyebrow>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] lg:text-5xl">
            Put the balance to work.
            <br />
            <em>Withdraw when the pool can.</em>
          </h2>
          <p className="mt-5 max-w-xl text-muted-foreground">
            Customer float, treasury, and settlement balances sit in NZD stablecoins between movements of money. Those
            balances earn nothing while they wait. Deposit demo New Zealand dollars (dNZD) and the interest paid by
            borrowers accrues into the same currency.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {PLATFORM_USES.map(use => (
              <li key={use.title} className="border-t border-border pt-4">
                <div className="text-foreground">{use.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{use.detail}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-between gap-10">
          <div>
            <div className="tabular font-display text-5xl text-[var(--clay)]">
              {isLoading ? "-" : formatPercent(nzd?.supplyApyPercent ?? 0)}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">current rate on deposited NZD, variable</p>
          </div>

          <div>
            <ol className="flex flex-col gap-3 text-sm">
              {[
                "Deposit demo NZD (dNZD)",
                "Interest accrues into the balance",
                "Withdraw when the pool still holds the funds",
              ].map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-foreground">
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <Link
              href="/app?intent=earn"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--pine-deep)]"
            >
              Put float to work
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const StressSection = () => {
  const { bySymbol, isLoading } = useHackathonMarket();
  const nzd = bySymbol.dNZD;
  const eth = bySymbol.wETH;
  const poolReady = !isLoading && Boolean(nzd);

  return (
    <section className="border-y border-border bg-[var(--paper)]/60">
      <div className="container-page py-20">
        <Eyebrow>When it goes wrong</Eyebrow>
        <h2 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] lg:text-5xl">
          A loan, and the pool
          <br />
          <em>it draws on.</em>
        </h2>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Borrowing against a volatile asset means a large enough price fall can cost the collateral. The pool has a
          separate constraint: a depositor can take out only what is still there.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col">
            <Eyebrow>One position · 1 ETH deposited, NZ$1,000 borrowed</Eyebrow>
            <div className="overflow-x-auto">
              <table className="mt-5 w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 font-normal text-muted-foreground">If ETH falls</th>
                    <th className="pb-2 text-right font-normal text-muted-foreground">Health factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {POSITION_ROWS.map(row => (
                    <tr key={row.move}>
                      <td className="py-2.5">{row.move}</td>
                      <td className={`tabular py-2.5 text-right font-mono ${row.tone}`}>{row.hf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              An illustration, not a live position, and not a forecast. The stress tester reads the collateral at the
              prototype&apos;s oracle price
              {eth && eth.oraclePrice > 0n ? ` (ETH is currently ${formatBase(eth.oraclePrice)}) ` : " "}
              and shows the decline at which liquidation would begin.
            </p>
            <Link
              href="/market"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-input px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Open the stress tester
              <span aria-hidden>→</span>
            </Link>
          </Card>

          <Card className="flex flex-col">
            <Eyebrow>The pool · what can leave today</Eyebrow>
            <div className="mt-6 grid grid-cols-2 gap-6">
              <Stat
                label="Deposited"
                value={
                  poolReady && nzd ? (
                    formatNzd(nzd.totalSupplied, nzd.decimals, { decimals: 0 })
                  ) : (
                    <Skeleton className="h-7 w-24" />
                  )
                }
              />
              <Stat
                label="Lent out"
                value={
                  poolReady && nzd ? (
                    formatNzd(nzd.totalBorrowed, nzd.decimals, { decimals: 0 })
                  ) : (
                    <Skeleton className="h-7 w-24" />
                  )
                }
              />
              <Stat
                label="Available to withdraw"
                value={
                  poolReady && nzd ? (
                    formatNzd(nzd.availableLiquidity, nzd.decimals, { decimals: 0 })
                  ) : (
                    <Skeleton className="h-7 w-24" />
                  )
                }
                accent
              />
              <Stat
                label="Lent out share"
                value={poolReady && nzd ? formatPercent(nzd.utilisationPercent, 1) : <Skeleton className="h-7 w-16" />}
              />
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              A platform can withdraw only what the pool still holds. What is lent out comes back when borrowers repay,
              or when collateral is liquidated. A fall in the price of that collateral does not reprice a New Zealand
              dollar deposit. It can change when the lent funds return.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

const BorrowSection = () => {
  const { bySymbol, isLoading } = useHackathonMarket();
  const nzd = bySymbol.dNZD;
  const eth = bySymbol.wETH;

  return (
    <section className="bg-[var(--pine-deep)] text-[var(--cream)]">
      <div className="container-page grid gap-10 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <Eyebrow className="text-[var(--moss)]">If you hold ETH or Bitcoin</Eyebrow>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] lg:text-5xl">
            Get New Zealand dollars
            <br />
            <em className="text-[var(--moss)]">without selling.</em>
          </h2>
          <p className="mt-5 max-w-xl text-[var(--cream)]/75">
            Deposit test ETH or test Bitcoin as collateral and borrow demo New Zealand dollars against it. You are not
            selling the collateral. Repay and take it back. Prices on this prototype come from fixed test oracles.
          </p>
          <p className="mt-8 max-w-xl text-xs leading-relaxed text-[var(--cream)]/60">
            Borrowing against your crypto is not the same as selling it, so you keep the asset. Whether that has any
            bearing on your tax position depends on your own circumstances. This is not tax advice, and it is worth
            speaking to an accountant. If your collateral falls far enough in value, some of it can be sold to repay
            what you owe.
          </p>
        </div>

        <div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--cream)]/60">
                Borrow up to
              </div>
              <div className="tabular mt-1 font-display text-2xl">
                {isLoading ? "-" : formatPercent(eth?.maxLtvPercent ?? 0, 0)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--cream)]/60">
                Borrow rate
              </div>
              <div className="tabular mt-1 font-display text-2xl">
                {isLoading ? "-" : formatPercent(nzd?.borrowApyPercent ?? 0)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--cream)]/60">Collateral</div>
              <div className="mt-1 font-display text-2xl">ETH · BTC</div>
            </div>
          </div>

          <Link
            href="/app?intent=borrow"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--clay)] px-6 py-3.5 text-sm font-medium text-[var(--cream)] transition-transform hover:-translate-y-0.5"
          >
            See what you could borrow
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--cream)]/60">
            {isPrivyEnabled
              ? "Sign in with an email address · No wallet to install"
              : "Connect a wallet to get started"}
          </p>
        </div>
      </div>
    </section>
  );
};

const INTEGRATION_PATHS = [
  {
    title: "Contracts",
    body: "Call the Aave V3 pool on Sepolia directly: supply, withdraw, borrow, and repay. Pool and token addresses are published with the market.",
    href: "/market",
    label: "Market contracts",
  },
  {
    title: "REST API",
    body: "Read rates, positions, and stress results over HTTP. Open, unauthenticated, and read-only. No API key and no wallet signature.",
    href: "/developer-api",
    label: "API for developers",
  },
  {
    title: "Agent",
    body: "Ask in conversation. Each answer is a real call to the same API, generated from the published specification.",
    href: "/binance-chat",
    label: "Ask the API agent",
  },
];

const IntegrationSection = () => (
  <section id="integration" className="container-page scroll-mt-24 py-20">
    <Eyebrow>Integration</Eyebrow>
    <h2 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] lg:text-5xl">
      How a platform
      <br />
      <em>plugs in.</em>
    </h2>
    <p className="mt-5 max-w-2xl text-muted-foreground">
      Three ways to use the market. The contracts move the assets. The API and the agent read the same market, including
      the stress test, without a signature.
    </p>

    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      {INTEGRATION_PATHS.map(path => (
        <Card key={path.title} className="flex flex-col">
          <h3 className="font-display text-2xl">{path.title}</h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{path.body}</p>
          <Link href={path.href} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground">
            {path.label}
            <span aria-hidden>→</span>
          </Link>
        </Card>
      ))}
    </div>

    <a
      href="/api/v1/openapi.json"
      target="_blank"
      rel="noreferrer"
      className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--pine-deep)]"
    >
      OpenAPI specification
      <span aria-hidden>→</span>
    </a>
  </section>
);

const ContactSection = () => {
  const contactEmail = getPublicContactEmail();

  return (
    <section id="contact" className="scroll-mt-24 border-y border-border bg-[var(--paper)]/60">
      <div className="container-page py-20">
        <Eyebrow>Talk to us</Eyebrow>
        <h2 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] lg:text-5xl">
          A platform can reach
          <br />
          <em>the founders directly.</em>
        </h2>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Custody float, a distribution pool, or a treasury balance. Write and we will walk through how it would sit on
          Ora.
        </p>
        {contactEmail ? (
          <a
            href={`mailto:${contactEmail}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--pine-deep)]"
          >
            {contactEmail}
            <span aria-hidden>→</span>
          </a>
        ) : null}
      </div>
    </section>
  );
};

const Footnote = () => (
  <section className="container-page py-20">
    <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
      <div>
        <Eyebrow>What is underneath</Eyebrow>
        <p className="mt-6 max-w-3xl font-display text-3xl leading-[1.15] lg:text-4xl">
          Deposits and loans sit in Aave V3 contracts on Ethereum Sepolia. Balances, rates and every transaction are on
          a public ledger you can read yourself.
        </p>
        <p className="mt-6 max-w-2xl text-muted-foreground">
          Ora does not custody the test assets. Each deposit, withdrawal, loan and repayment is a transaction you
          approve. Rates are variable and are not guaranteed.
        </p>
      </div>
      <div className="flex flex-col justify-end gap-3">
        <Link
          href="/market"
          className="inline-flex items-center justify-between gap-3 rounded-full border border-input px-6 py-4 text-sm font-medium transition-colors hover:bg-card"
        >
          Rates and contracts
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/app"
          className="inline-flex items-center justify-between gap-3 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[var(--pine-deep)]"
        >
          Open your account
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  </section>
);
