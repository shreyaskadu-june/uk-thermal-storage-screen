// Page wiring for the thermal storage screen: inputs, comparison table, chart, sensitivities.
(function () {
  'use strict';
  var D = TES_DATA, M = TESModel;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (x, d) {
    return isFinite(x) ? x.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–';
  };
  var gbp = function (x, d) { return '£' + fmt(x, d === undefined ? 2 : d); };
  var chart = null;

  // ---------- inputs ----------
  function readScenario() {
    return {
      E: +$('E').value,
      cycles: +$('cycles').value,
      days: +$('days').value,
      price: +$('price').value,
      rr: +$('rr').value / 100
    };
  }

  function validate(s) {
    if (!(s.E > 0)) return 'Energy per cycle must be positive.';
    if (!(s.cycles > 0)) return 'Cycles per year must be positive.';
    if (!(s.days >= 0)) return 'Storage time cannot be negative.';
    if (!(s.price >= 0)) return 'Input energy cost cannot be negative.';
    if (!(s.rr >= 0)) return 'Discount rate cannot be negative.';
    if (!selected().length) return 'Select at least one technology.';
    return '';
  }

  function selected() {
    return D.techs.filter(function (t) { return $('sel-' + t.id).checked; });
  }

  // Parameters for one technology. `over` replaces single inputs for sensitivity runs.
  function paramsFor(t, s, over) {
    over = over || {};
    return {
      E: s.E, cycles: s.cycles, days: s.days, price: over.price !== undefined ? over.price : s.price,
      r: over.r !== undefined ? over.r : s.rr,
      capex: over.capex !== undefined ? over.capex : t.capex.central,
      eta: over.eta !== undefined ? over.eta : t.eta.central,
      lossDay: over.lossDay !== undefined ? over.lossDay : t.lossDay.central,
      life: over.life !== undefined ? over.life : t.life.central,
      om: over.om !== undefined ? over.om : t.om.central
    };
  }

  // Favourable and unfavourable envelope: every factor at its end of the range together.
  function envelope(t, s) {
    var good = M.evaluate(paramsFor(t, s, {
      capex: t.capex.low, eta: t.eta.high, lossDay: t.lossDay.low, life: t.life.high, om: t.om.low, r: D.discount.low
    })).lcos;
    var bad = M.evaluate(paramsFor(t, s, {
      capex: t.capex.high, eta: t.eta.low, lossDay: t.lossDay.high, life: t.life.low, om: t.om.high, r: D.discount.high
    })).lcos;
    return { low: Math.min(good, bad), high: Math.max(good, bad) };
  }

  // ---------- rendering ----------
  function renderComparison(s, techs) {
    var rows = techs.map(function (t) {
      var r = M.evaluate(paramsFor(t, s));
      var env = envelope(t, s);
      return { t: t, r: r, env: env };
    });
    var head = '<tr><th>Technology</th><th class="num">Capex (£)</th><th class="num">Annual cost (£/yr)</th>' +
      '<th class="num">Cost per kWh delivered (£)</th><th class="num">Range (£/kWh)</th>' +
      '<th class="num">Efficiency per cycle</th><th class="num">Kept after storage</th></tr>';
    var body = rows.map(function (x) {
      return '<tr><td class="tech-name">' + x.t.name + '</td>' +
        '<td class="num">' + fmt(x.r.capex, 0) + '</td>' +
        '<td class="num">' + fmt(x.r.annual, 0) + '</td>' +
        '<td class="num">' + gbp(x.r.lcos, 3) + '</td>' +
        '<td class="num">' + gbp(x.env.low, 3) + ' – ' + gbp(x.env.high, 3) + '</td>' +
        '<td class="num">' + fmt(x.r.overallEff * 100, 0) + '%</td>' +
        '<td class="num">' + fmt(x.r.retained * 100, 1) + '%</td></tr>';
    }).join('');
    $('compTable').innerHTML = '<thead>' + head + '</thead><tbody>' + body + '</tbody>';

    // Chart: central cost per kWh delivered, with the envelope as a range label in the tooltip
    var labels = rows.map(function (x) { return x.t.name; });
    var values = rows.map(function (x) { return x.r.lcos; });
    var ranges = rows.map(function (x) { return [x.env.low, x.env.high]; });
    if (chart) chart.destroy();
    chart = new Chart($('lcosChart'), {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: '£/kWh delivered (central)', data: values, backgroundColor: '#2d4a6b' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { afterLabel: function (ctx) {
            var rg = ranges[ctx.dataIndex];
            return 'Range ' + gbp(rg[0], 3) + ' – ' + gbp(rg[1], 3);
          } } }
        },
        scales: { y: { beginAtZero: true, title: { display: true, text: '£ per kWh delivered' } } }
      }
    });
    return rows;
  }

  function sensRows(t, s) {
    var f = function (lcos) { return gbp(lcos, 3); };
    var base = M.evaluate(paramsFor(t, s)).lcos;
    var items = [
      { k: 'Capex', lo: 'low', hi: 'high', pl: function (v) { return { capex: v }; }, vl: t.capex.low, vh: t.capex.high, fmt: function (v) { return gbp(v, 0) + '/kWh'; } },
      { k: 'Efficiency', lo: 'high', hi: 'low', pl: function (v) { return { eta: v }; }, vl: t.eta.high, vh: t.eta.low, fmt: function (v) { return fmt(v * 100, 0) + '%'; } },
      { k: 'Standing loss', lo: 'low', hi: 'high', pl: function (v) { return { lossDay: v }; }, vl: t.lossDay.low, vh: t.lossDay.high, fmt: function (v) { return fmt(v * 100, 2) + '%/day'; } },
      { k: 'Lifetime', lo: 'high', hi: 'low', pl: function (v) { return { life: v }; }, vl: t.life.high, vh: t.life.low, fmt: function (v) { return fmt(v, 0) + ' yr'; } },
      { k: 'O&amp;M', lo: 'low', hi: 'high', pl: function (v) { return { om: v }; }, vl: t.om.low, vh: t.om.high, fmt: function (v) { return fmt(v * 100, 2) + '%/yr'; } },
      { k: 'Discount rate', lo: 'low', hi: 'high', pl: function (v) { return { r: v }; }, vl: D.discount.low, vh: D.discount.high, fmt: function (v) { return fmt(v * 100, 2) + '%'; } }
    ];
    return items.map(function (it) {
      var a = M.evaluate(paramsFor(t, s, it.pl(it.vl))).lcos;
      var b = M.evaluate(paramsFor(t, s, it.pl(it.vh))).lcos;
      return '<tr><td>' + it.k + '</td><td class="num">' + it.fmt(it.vl) + ' → ' + f(a) +
        '</td><td class="num">' + it.fmt(it.vh) + ' → ' + f(b) +
        '</td><td class="num">' + gbp(Math.abs(b - a), 3) + '</td></tr>';
    }).join('');
  }

  function renderSens(s, techs) {
    $('sensWrap').innerHTML = techs.map(function (t) {
      return '<div class="sens-block"><h4>' + t.name + ' (central ' + gbp(M.evaluate(paramsFor(t, s)).lcos, 3) + ' per kWh)</h4>' +
        '<div class="table-wrap"><table class="sens-table"><thead><tr><th>Input</th>' +
        '<th class="num">Low end → £/kWh</th><th class="num">High end → £/kWh</th><th class="num">Swing</th></tr></thead>' +
        '<tbody>' + sensRows(t, s) + '</tbody></table></div></div>';
    }).join('');
  }

  function renderTechTable() {
    var head = '<tr><th>Technology</th><th class="num">Capex low–high (£/kWh, 2026)</th><th>Capex central</th>' +
      '<th class="num">Efficiency low / central / high</th><th class="num">Standing loss (%/day) central</th>' +
      '<th class="num">Life (yr) central</th><th class="num">O&amp;M (%/yr) central</th><th>Sources and notes</th></tr>';
    var body = D.techs.map(function (t) {
      return '<tr><td class="tech-name">' + t.name + '</td>' +
        '<td class="num">' + gbp(t.capex.low, 2) + ' – ' + gbp(t.capex.high, 2) + '</td>' +
        '<td>' + t.capexNote + '</td>' +
        '<td class="num">' + fmt(t.eta.low * 100, 0) + ' / ' + fmt(t.eta.central * 100, 0) + ' / ' + fmt(t.eta.high * 100, 0) + '%</td>' +
        '<td class="num">' + fmt(t.lossDay.central * 100, 2) + '</td>' +
        '<td class="num">' + fmt(t.life.central, 0) + '</td>' +
        '<td class="num">' + fmt(t.om.central * 100, 2) + '</td>' +
        '<td>' + t.etaNote + ' ' + t.lossNote + ' ' + t.lifeNote + ' ' + t.scaleNote + '</td></tr>';
    }).join('');
    $('techTable').innerHTML = '<thead>' + head + '</thead><tbody>' + body + '</tbody>';
  }

  function renderNotes(s, techs) {
    var notes = [];
    if (s.days > 60 && techs.some(function (t) { return t.id === 'tank'; })) {
      notes.push('At ' + fmt(s.days, 0) + ' days of storage, a hot water tank keeps only ' + fmt(Math.pow(1 - D.techs[0].lossDay.central, s.days) * 100, 0) + '% of its energy at the central standing loss.');
    }
    if (s.E > 10000 && techs.some(function (t) { return t.id === 'tank'; })) {
      notes.push('The tank capex range is the domestic range (£/kWh). At this scale it is likely overstated: the UK source gives £91–114/m³ for large interseasonal stores, which is not converted here.');
    }
    if (s.days < 60 && techs.some(function (t) { return t.id === 'btes'; })) {
      notes.push('Borehole storage is normally seasonal; daily cycling is shown for comparison only.');
    }
    $('compNote').textContent = notes.join(' ');
    $('compNote').className = 'notice' + (notes.length ? ' warn' : '');
  }

  function setScenarioInputs(key) {
    var p = D.presets[key];
    $('E').value = p.E; $('cycles').value = p.cycles; $('days').value = p.days;
    $('presetNote').textContent = p.label + '. Change any input to set your own scenario.';
  }

  function render() {
    var s = readScenario();
    var err = validate(s);
    $('inputErr').textContent = err;
    if (err) return;
    var techs = selected();
    var label = $('preset').options[$('preset').selectedIndex].text;
    $('headName').textContent = techs.map(function (t) { return t.name; }).join(', ');
    $('headScale').textContent = fmt(s.E, 0) + ' kWh, ' + fmt(s.cycles, 0) + (s.cycles === 1 ? ' cycle' : ' cycles') + '/yr, ' + fmt(s.days, 1) + ' days stored';
    renderComparison(s, techs);
    renderSens(s, techs);
    renderNotes(s, techs);
  }

  function init() {
    var sel = $('techSelect');
    D.techs.forEach(function (t) {
      var lab = document.createElement('label');
      lab.innerHTML = '<input type="checkbox" id="sel-' + t.id + '" checked> ' + t.name;
      sel.appendChild(lab);
      $('sel-' + t.id).addEventListener('change', render);
    });
    var presetSel = $('preset');
    Object.keys(D.presets).forEach(function (k) {
      var o = document.createElement('option'); o.value = k; o.textContent = D.presets[k].label; presetSel.appendChild(o);
    });
    $('rr').value = (D.discount.central * 100).toFixed(1);
    $('price').value = D.electricityPrice;
    setScenarioInputs('domestic');
    presetSel.addEventListener('change', function () { setScenarioInputs(presetSel.value); render(); });
    ['E', 'cycles', 'days', 'price', 'rr'].forEach(function (id) { $(id).addEventListener('input', render); });
    $('recalc').addEventListener('click', render);
    renderTechTable();
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
