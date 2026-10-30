# UK Thermal Energy Storage Screen

A public screening calculator that compares the levelised cost of storing heat in a hot water tank, pit storage (PTES), borehole ground storage (BTES) and phase change material (PCM), at the scale and cycling pattern the user selects.

Live page (once GitHub Pages is enabled): https://shreyaskadu-june.github.io/uk-thermal-storage-screen/

## Files

- `index.html`: layout and styles (self-contained stylesheet).
- `data.js`: technology inputs with low, central and high values, sources and notes, scenario presets, discount rate, electricity price.
- `model.js`: calculation only (no DOM), so it can be tested separately.
- `app.js`: inputs, comparison table, chart, sensitivity tables, technology table.
- `tests/regression.js`: regression checks (`node tests/regression.js`).

## What it models

- Levelised cost of storage per kWh delivered: annualised capital (capital recovery factor over the lifetime) + fixed O&M + cost of input energy, divided by energy delivered per year.
- Energy input per cycle = energy delivered ÷ (conversion efficiency × share retained after storage).
- Standing loss applies per day of storage. BTES uses its seasonal recovery factor instead.
- Comparison of any selection of the four technologies, with an envelope range (all factors at their favourable or unfavourable ends together).

## What it does not model

- Temperature-dependent performance, heat network losses, control strategy, grid services, tariffs, planning and permitting.
- Aquifer storage (ATES): the UK source gives costs per kW, not per kWh, so it cannot be compared yet.
- Molten salt, rock bed and thermochemical storage: no UK or open cost data found.

## Checks

- Domestic 10 kWh tank, central values, daily cycling: £0.268 per kWh delivered (hand calculation in `tests/regression.js`).
- Seasonal 180-day storage: a tank keeps about 70% of its energy at the central standing loss (0.2%/day); borehole keeps all of it because its recovery factor already includes seasonal losses.
- Overall efficiency = conversion efficiency × share retained, checked by the regression tests.

## Uncertainties and sensitivities

- Capital cost: the largest driver for all technologies. The UK ranges come from 2016 evidence with no price year, restated to 2026 £ with one factor (×1.44). Real uncertainty is wider than shown.
- Borehole capital: the UK source gives only a lower bound (0.30 £/kWh). The central (2×) and high (4×) values are assumptions.
- Standing loss, lifetime and O&M for tanks, PTES, BTES and PCM: no UK value found for most; labelled as assumptions. The Danish tank loss (0.2%/day) is used only as a labelled reference.
- Tank capex: the domestic range applied at district scale is likely overstated. The UK source gives £91–114/m³ for large interseasonal stores, which is not converted yet. The page shows a warning above 10 MWh.
- Scale: the UK source states that borehole stores are viable above about 20,000 m³; the page notes this without converting it to a kWh threshold.
- Input energy cost is the electricity price (16.8p/kWh). Heat-pump charging, gas or network heat would change the results.

## Sources and yearly review

| Input | Value | Source | Status |
|---|---|---|---|
| Water tank capex | 25–180 £/kWh (2015 money), central 67 | DECC/DELTA-EE, *Evidence Gathering: Thermal Energy Storage* (BEIS, 2016), Table 4 and Table 10 | Sourced (price year assumed 2015) |
| Water tank efficiency | 50–90%, central 70% | Same, Tables 2 and 10 | Sourced range; central is an assumption |
| Water tank standing loss | 0.14–0.24%/day, central 0.2% | Danish Energy Agency, Technology Data: Energy Storage, large tanks (reference only) | Assumption informed by a non-UK source |
| PTES capex | 0.30–0.80 £/kWh (2015 money) | DECC/DELTA-EE, Table 4 | Sourced |
| PTES efficiency | 60–80%, central 65% | DESNZ (May 2025), operational inefficiencies (60–70% pilots); DECC Table 2 (up to 80%) | Sourced range |
| PTES life | 15–25 years, central 20 | DESNZ (May 2025): 20 years without lid replacement unproven | Range is an assumption |
| BTES capex | 0.30 £/kWh lower bound (2015) | DECC/DELTA-EE, Table 4 | Only the lower bound is sourced; central and high are assumptions |
| BTES efficiency | Seasonal 50–60%, central 55% | DESNZ (May 2025), operational inefficiencies (Desguers et al. 2024) | Sourced |
| BTES viability | Above about 20,000 m³ | DESNZ (May 2025), citing Kallesøe et al. 2021 | Sourced (stated as a threshold) |
| PCM capex | 50–400 £/kWh (2015 money), central 250 | DECC/DELTA-EE, Table 4 | Sourced |
| PCM efficiency | 75–90%, central 82% | DECC/DELTA-EE, Table 2 | Sourced range |
| O&M | 0.25–1% of investment per year | DECC/DELTA-EE §1.3 (Solites, 2012) | Sourced |
| Price restatement | ×1.44 (2015 → 2026 £) | officialdata.org (£1 in 2015 = £1.44 today) | Sourced |
| Electricity | 16.8p/kWh (£168/MWh) | DESNZ Energy Trends Q4 2025, manufacturing, excl. CCL | Sourced |
| Discount rate | 7% central; 5.18% and 9% in sensitivity | Investor assumption; Ofgem RIIO-3 final gas WACC 5.18% | Assumption; WACC is a regulated benchmark |

**Review steps (each year):** check DESNZ and BEIS for updated thermal storage cost evidence; check officialdata.org for the restatement factor; check the electricity price in the latest DESNZ Energy Trends; update `data.js` and the sources table, then run `node tests/regression.js`. Last reviewed 30 October 2026.

## Running and publishing

Open `index.html` in a browser, or enable GitHub Pages (Deploy from branch, `main`, `/ root`). Libraries load from cdnjs (Chart.js 4.4.1) and Google Fonts.
