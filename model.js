// Thermal energy storage: levelised cost of storage (LCOS) per kWh delivered.
// Pure calculation module (no DOM), so it can be tested separately.
(function (root) {
  'use strict';

  // Capital recovery factor: annual payment per £ of capital over n years at rate r (fraction).
  function crf(r, n) {
    if (r === 0) return 1 / n;
    var f = Math.pow(1 + r, n);
    return r * f / (f - 1);
  }

  // p fields:
  //   E       usable energy delivered per cycle (kWh)
  //   cycles  cycles per year
  //   days    storage duration per cycle (days) for standing losses
  //   price   energy cost of input energy (£/kWh put into the store)
  //   r       discount rate (fraction)
  //   capex   £ per kWh of store capacity
  //   eta     conversion efficiency, charge x discharge (fraction; excludes standing loss)
  //   lossDay standing loss (fraction of stored energy per day)
  //   life    lifetime (years)
  //   om      fixed O&M (fraction of capex per year)
  function evaluate(p) {
    var capex = p.capex * p.E;
    var retained = Math.pow(1 - p.lossDay, p.days);      // fraction of stored energy kept
    var inputPerCycle = p.E / (p.eta * retained);          // kWh put in per cycle
    var annCapex = crf(p.r, p.life) * capex;
    var annOm = p.om * capex;
    var inputYr = inputPerCycle * p.cycles;
    var annEnergy = inputYr * p.price;
    var deliveredYr = p.E * p.cycles;
    var annual = annCapex + annOm + annEnergy;
    return {
      capex: capex,
      annCapex: annCapex,
      annOm: annOm,
      annEnergy: annEnergy,
      annual: annual,
      deliveredYr: deliveredYr,
      inputYr: inputYr,
      lcos: annual / deliveredYr,                      // £ per kWh delivered
      overallEff: p.E / inputPerCycle,                 // delivered / put in, per cycle
      retained: retained
    };
  }

  var api = { crf: crf, evaluate: evaluate };
  root.TESModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
