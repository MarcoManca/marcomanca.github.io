document.addEventListener('DOMContentLoaded', function () {
  const loader = document.getElementById('pub-loader');
  const list = document.getElementById('pub-list');
  const container = document.getElementById('publications'); // for aria-busy
  const url = 'https://apilab.isti.cnr.it/api/publications/search';
  // dynamic year range: fromYear = currentYear - 1, toYear = currentYear
  const currentYear = new Date().getFullYear();
  const payload = { "authors": [{ "display": "Manca, Marco", "value": "Manca, Marco" }], "title": "", "luogo": "", "fromYear": currentYear - 1, "toYear": currentYear };
  const irisFullListUrl = 'https://iris.cnr.it/browse?filter_value_display=MANCA%2C+MARCO&type=author&offset=0&authority=rp02494&sort_by=2&order=DESC&rpp=20&submit_browse=Aggiorna';

  function sanitizeId(s) { return String(s).replace(/[^a-z0-9_-]/gi, '_'); }
  function showLoader() {
    if (container) container.setAttribute('aria-busy', 'true');
    if (loader) loader.style.display = 'flex';
  }
  function hideLoader() {
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    if (container) container.removeAttribute('aria-busy');
  }

  async function loadPubs() {
    showLoader();
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
      const data = await res.json();

      // Flatten records across years into single array, attach year if missing
      const items = [];
      Object.keys(data || {}).forEach(function (k) {
        const arr = Array.isArray(data[k]) ? data[k] : [];
        arr.forEach(function (rec) {
          const year = rec.anno || parseInt(k, 10) || null;
          items.push(Object.assign({}, rec, { _year: year }));
        });
      });

      // Filter out tipo === 'Other' (case-insensitive)
      const filtered = items.filter(function (r) { return !(r.tipo && String(r.tipo).toLowerCase() === 'other'); });

      // Sort by year desc, then keep API order
      filtered.sort(function (a, b) {
        const ya = a._year || 0; const yb = b._year || 0;
        return yb - ya;
      });

      // Take only the 5 most recent
      const top5 = filtered.slice(0, 5);

      // Clear existing list
      list.innerHTML = '';

      if (top5.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No publications found.';
        list.appendChild(li);
        return;
      }

      // Group by year for display
      const grouped = top5.reduce(function (acc, rec) {
        const y = rec._year || 'Unk';
        acc[y] = acc[y] || [];
        acc[y].push(rec);
        return acc;
      }, {});

      Object.keys(grouped).sort(function(a,b){return b - a;}).forEach(function (year) {
        const itemsForYear = grouped[year];
        const yearLi = document.createElement('li');
        const yearHeading = document.createElement('h3');
        yearHeading.className = 'h5 mt-3';
        yearHeading.textContent = year;
        yearLi.appendChild(yearHeading);

        const innerOl = document.createElement('ol');
        innerOl.className = 'mb-3';

        itemsForYear.forEach(function (rec, idx) {
          const li = document.createElement('li');
          const article = document.createElement('article');

          const itemId = 'pub-' + sanitizeId(year) + '-' + idx;
          article.setAttribute('aria-labelledby', itemId);

          const h3 = document.createElement('h4');
          h3.id = itemId;
          h3.className = 'h6';
          h3.textContent = rec.titolo || 'Untitled';

          const meta = document.createElement('p');
          meta.className = 'muted';

          // Build authors list as DOM nodes and highlight occurrences of "Manca M" (with or without period)
          const authorsArr = Array.isArray(rec.autori) ? rec.autori : (rec.autore ? [rec.autore] : []);
          if (authorsArr.length) {
            const frag = document.createDocumentFragment();
            const reManca = /\bManca\s+M\.?/i;
            authorsArr.forEach(function (a, i) {
              if (reManca.test(a)) {
                const strong = document.createElement('strong');
                strong.textContent = a;
                strong.style.color = '#000'; // Always black text
                frag.appendChild(strong);
              } else {
                const span = document.createElement('span');
                span.textContent = a;
                span.style.color = '#000'; // Always black text
                frag.appendChild(span);
              }
              if (i < authorsArr.length - 1) frag.appendChild(document.createTextNode(', '));
            });
            meta.appendChild(frag);
          }

          // Append other metadata (type, place, year) after authors
          const otherParts = [];
          if (rec.tipo) otherParts.push(rec.tipo);
          if (rec.luogo) otherParts.push(rec.luogo);
          if (rec.anno) otherParts.push(rec.anno);
          if (otherParts.length) {
            if (meta.childNodes.length) meta.appendChild(document.createTextNode(' — '));
            const metaSpan = document.createElement('span');
            metaSpan.style.color = '#000';
            metaSpan.textContent = otherParts.join(' — ');
            meta.appendChild(metaSpan);
          }

          // Allegato link: generic text but descriptive aria-label
          if (rec.allegato) {
            const a = document.createElement('a');
            a.href = rec.allegato;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = 'Download the paper';
            a.title = rec.titolo || 'Download the paper';
            a.setAttribute('aria-label', (rec.titolo ? ('Download the paper: ' + rec.titolo) : 'Download the paper') + ' (opens in a new tab)');
            a.className = 'ms-2';
            if (meta.textContent) meta.appendChild(document.createTextNode(' '));
            meta.appendChild(a);
          }

          article.appendChild(h3);
          article.appendChild(meta);
          li.appendChild(article);
          innerOl.appendChild(li);
        });

        yearLi.appendChild(innerOl);
        list.appendChild(yearLi);
      });

      // Add link to full list on IRIS
      const fullP = document.createElement('p');
      fullP.className = 'mt-3';
      const fullA = document.createElement('a');
      fullA.href = irisFullListUrl;
      fullA.target = '_blank';
      fullA.rel = 'noopener noreferrer';
      fullA.textContent = 'Full list of publications on IRIS Repository';
      fullA.setAttribute('aria-label', 'Full list of publications on IRIS Repository (opens in a new tab)');
      fullP.appendChild(fullA);
      list.appendChild(fullP);

    } catch (err) {
      console.error('Failed to load publications:', err);
      list.innerHTML = '';
      const li = document.createElement('li');
      li.textContent = 'Unable to load publications at this time.';
      list.appendChild(li);
    } finally {
      hideLoader();
    }
  }

  loadPubs();
});
