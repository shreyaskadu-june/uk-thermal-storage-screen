// Regression checks for the thermal storage screen. Run: node tests/regression.js
const path = require('path');
const root = path.join(__dirname, '..');
require(path.join(root, 'model.js'));
require(path.join(root, 'data.js'));
const M = globalThis.TESModel;
const D = globalThis.TES_DATA;

let fails = 0;
function check(name, got, want, tol) {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) fails++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + ': got ' + (+got).toFixed(5) + ', want ' + want + ' ±' + tol);
}

// 1. Capital recovery factor: 7% over 20 years = 0.094393 (standard annuity factor)
check('CRF(7%,20)', M.crf(0.07, 20), 0.094393, 0.00001);

// 2. Domestic tank, central values, daily cycling (hand calculation, see README):
//    capex 96.48 £/kWh x 10 kWh = 964.8; annual capex 91.07; O&M 9.65;
//    input per cycle = 10 / (0.70 x (1-0.002)^0.5) = 14.30 kWh; x365 x £0.168 = 876.6
//    total 977.3 / 3650 kWh = £0.2677 per kWh delivered
const tank = D.techs.find(function (t) { return t.id === 'tank'; });
const r = M.evaluate({
  E: 10, cycles: 365, days: 0.5, price: D.electricityPrice, r: D.discount.central,
  capex: tank.capex.central, eta: tank.eta.central, lossDay: tank.lossDay.central,
  life: tank.life.central, om: tank.om.central
});
check('domestic tank LCOS £/kWh', r.lcos, 0.2677, 0.0005);
check('domestic tank annual capex £', r.annCapex, 91.07, 0.1);

// 3. Seasonal storage loses energy with duration: 180 days at 0.2%/day keeps about 70%
const seasonTank = M.evaluate({
  E: 100000, cycles: 1, days: 180, price: D.electricityPrice, r: D.discount.central,
  capex: tank.capex.central, eta: tank.eta.central, lossDay: tank.lossDay.central,
  life: tank.life.central, om: tank.om.central
});
check('tank retained after 180 days', seasonTank.retained, Math.pow(0.998, 180), 1e-9);

// 4. Borehole storage has no standing loss (already in the recovery factor)
const btes = D.techs.find(function (t) { return t.id === 'btes'; });
const b = M.evaluate({
  E: 100000, cycles: 1, days: 180, price: D.electricityPrice, r: D.discount.central,
  capex: btes.capex.central, eta: btes.eta.central, lossDay: btes.lossDay.central,
  life: btes.life.central, om: btes.om.central
});
check('BTES retained after 180 days (no standing loss)', b.retained, 1, 1e-12);

// 4b. Large-store tank capex: 102.5 £/m³ (2015) x 1.44 / (1.163 kWh/m³K x 40 K) = 3.173 £/kWh
const large = M.evaluate({ E: 100000, cycles: 1, days: 0, price: D.electricityPrice, r: D.discount.central,
  capex: tank.capexLarge.central, eta: tank.eta.central, lossDay: 0, life: tank.life.central, om: tank.om.central });
check('large tank central capex £/kWh', tank.capexLarge.central, 3.1731, 0.0005);
check('large tank capex £ at 100 MWh', large.capex, 317310, 50);

// 5. Restatement: 2015 values restated by 1.44
check('restatement factor', D.restate, 1.44, 1e-12);
check('PTES low capex restated £/kWh', D.techs[1].capex.low, 0.432, 1e-9);

// 6. Energy balance: delivered = input x efficiency (per cycle), overall efficiency = eta x retained
const e = M.evaluate({ E: 1000, cycles: 100, days: 30, price: 0.1, r: 0.07, capex: 100, eta: 0.8, lossDay: 0.001, life: 20, om: 0.01 });
check('overall efficiency = eta x retained', e.overallEff, 0.8 * Math.pow(0.999, 30), 1e-9);

console.log(fails === 0 ? '\nAll regression checks passed.' : '\n' + fails + ' check(s) FAILED.');
process.exit(fails === 0 ? 0 : 1);
