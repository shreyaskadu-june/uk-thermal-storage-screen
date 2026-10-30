// Technology parameters for the UK thermal energy storage screen.
// Each value has low / central / high. Source notes say where each value comes from.
// Prices in the UK sources have no stated price year; they are treated as 2015 money and
// restated to 2026 £ with the factor below (officialdata.org: £1 in 2015 = £1.44 today).
(function (root) {
  'use strict';

  var RESTATE = 1.44;
  var UK_DECC = 'DECC/DELTA-EE, Evidence Gathering: Thermal Energy Storage (BEIS, 2016)';
  var UK_DESNZ = 'DESNZ, Exploring the take-up and usage of thermal energy storage in heat networks (RAF062/2324, May 2025)';
  var ASSUMED = 'Assumption: no UK source found.';

  var TECHS = [
    {
      id: 'tank', name: 'Hot water tank',
      capex: { low: 25 * RESTATE, central: 67 * RESTATE, high: 180 * RESTATE },
      capexNote: 'Domestic range 25–180 £/kWh (' + UK_DECC + ', Table 4); central is the geometric mean of that range (67 £/kWh, 2015).',
      eta: { low: 0.5, central: 0.7, high: 0.9 },
      etaNote: '50–90% (' + UK_DECC + ', Tables 2 and 10); central is the midpoint, an assumption.',
      lossDay: { low: 0.0014, central: 0.002, high: 0.0024 },
      lossNote: 'Not quantified for UK tanks. Values assumed from a Danish large-tank figure of 0.2%/day (range 0.14–0.24%). ' + ASSUMED,
      life: { low: 15, central: 20, high: 25 },
      lifeNote: 'Not stated in UK sources. ' + ASSUMED,
      om: { low: 0.0025, central: 0.01, high: 0.01 },
      omNote: 'About 0.25–1% of investment per year, cited in ' + UK_DECC + ' §1.3 (Solites, 2012).',
      scaleNote: 'Suits building and domestic scale. Seasonal storage at tank scale loses most of its energy (see the seasonal preset).',
      sources: [UK_DECC]
    },
    {
      id: 'ptes', name: 'Pit storage (PTES)',
      capex: { low: 0.30 * RESTATE, central: 0.55 * RESTATE, high: 0.80 * RESTATE },
      capexNote: 'District heating 0.30–0.80 £/kWh (' + UK_DECC + ', Table 4); central is the midpoint.',
      eta: { low: 0.6, central: 0.65, high: 0.8 },
      etaNote: '60–70% in UK pilot studies (' + UK_DESNZ + ', operational inefficiencies); up to 80% (' + UK_DECC + ', Table 2).',
      lossDay: { low: 0.0005, central: 0.001, high: 0.002 },
      lossNote: 'Not quantified for UK pits. Central 0.1%/day is an assumption, roughly consistent with a Danish 0.04–0.08 K/day temperature drop. ' + ASSUMED,
      life: { low: 15, central: 20, high: 25 },
      lifeNote: 'A 20-year life without lid replacement is unproven (' + UK_DESNZ + ', technology maturity). Range is an assumption.',
      om: { low: 0.01, central: 0.01, high: 0.02 },
      omNote: 'Assumed 1–2% of investment; pit covers often need replacing but are rarely budgeted for (' + UK_DESNZ + ', costs).',
      scaleNote: 'District scale. Cost benchmarks in the sources assume large stores; UK screening should not use it below about 10,000 m³ without a check.',
      sources: [UK_DECC, UK_DESNZ]
    },
    {
      id: 'btes', name: 'Ground storage (BTES)',
      capex: { low: 0.30 * RESTATE, central: 2 * 0.30 * RESTATE, high: 4 * 0.30 * RESTATE },
      capexNote: 'UK source gives a lower bound of 0.30 £/kWh for district heating (' + UK_DECC + ', Table 4). Central (2×) and high (4×) are assumptions, not sourced.',
      eta: { low: 0.5, central: 0.55, high: 0.6 },
      etaNote: 'Seasonal recovery factor 50–60% (' + UK_DESNZ + ', operational inefficiencies). Short-cycle recovery exceeds 85%, so use the seasonal value only for seasonal presets.',
      lossDay: { low: 0, central: 0, high: 0 },
      lossNote: 'Seasonal losses are already in the recovery factor, so no separate standing loss is applied.',
      life: { low: 25, central: 30, high: 40 },
      lifeNote: 'Not stated in UK sources. ' + ASSUMED,
      om: { low: 0.01, central: 0.01, high: 0.02 },
      omNote: 'Assumed 1–2% of investment. ' + ASSUMED,
      scaleNote: 'Viable only for large stores: the UK source suggests more than about 20,000 m³ (' + UK_DESNZ + ', citing Kallesøe et al. 2021).',
      sources: [UK_DECC, UK_DESNZ]
    },
    {
      id: 'pcm', name: 'Phase change material (PCM)',
      capex: { low: 50 * RESTATE, central: 250 * RESTATE, high: 400 * RESTATE },
      capexNote: '250–400 £/kWh, as low as 50 £/kWh for large applications (' + UK_DECC + ', Table 4). Central is the bottom of the 250–400 range.',
      eta: { low: 0.75, central: 0.82, high: 0.9 },
      etaNote: '75–90% (' + UK_DECC + ', Table 2); central is the midpoint.',
      lossDay: { low: 0.0005, central: 0.001, high: 0.002 },
      lossNote: 'Described as much lower than sensible stores, with no number given (' + UK_DECC + ', §2.1). ' + ASSUMED,
      life: { low: 15, central: 20, high: 25 },
      lifeNote: 'Not stated in UK sources. ' + ASSUMED,
      om: { low: 0.01, central: 0.02, high: 0.03 },
      omNote: 'PCM is described as needing more maintenance than tanks (' + UK_DESNZ + ', costs); 2% central is an assumption.',
      scaleNote: 'Compact and high-cost; suited to space-limited building or domestic use.',
      sources: [UK_DECC, UK_DESNZ]
    }
  ];

  var PRESETS = {
    domestic: { label: 'Domestic daily (10 kWh)', E: 10, cycles: 365, days: 0.5 },
    building: { label: 'Building daily (500 kWh)', E: 500, cycles: 365, days: 0.5 },
    district: { label: 'District daily (10 MWh)', E: 10000, cycles: 365, days: 0.5 },
    seasonal: { label: 'Seasonal (100 MWh, 1 cycle/yr)', E: 100000, cycles: 1, days: 180 }
  };

  root.TES_DATA = {
    restate: RESTATE,
    priceBasis: 'UK sources give no price year; treated as 2015 money and restated to 2026 £ by ×' + RESTATE + ' (officialdata.org).',
    electricityPrice: 0.168,
    electricityNote: 'DESNZ Energy Trends Q4 2025 manufacturing price, 16.8p/kWh excl. CCL (same as the hydrogen screen).',
    discount: { low: 0.0518, central: 0.07, high: 0.09 },
    discountNote: '7% investor-rate assumption; 5.18% is the Ofgem final gas WACC (RIIO-3); 9% an investor-risk assumption.',
    techs: TECHS,
    presets: PRESETS
  };
})(typeof window !== 'undefined' ? window : globalThis);
