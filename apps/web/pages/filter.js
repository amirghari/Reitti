/*
 * The language filter on a city page (?spoken=), the same rules as /directory
 * (D-37): several languages may be on at once and a card matches if it offers
 * any of them; the choice lives in the address, comma-joined, so a filtered view
 * can be shared; a value the page has no button for is dropped. Finnish, Swedish
 * and English always have a button, as on /directory, so asking for one nobody
 * here offers says so instead of quietly showing everyone.
 *
 * Progressive: without this script the filter stays hidden and every card shows.
 * Plain JavaScript, no build step, served from this site (CSP script-src 'self').
 */
(function () {
  var filter = document.querySelector('[data-pro-filter]');
  if (!filter) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll('.cards > .card'));
  var buttons = Array.prototype.slice.call(filter.querySelectorAll('button[data-spoken]'));
  var count = document.querySelector('[data-pro-count]');
  var list = document.querySelector('.cards');
  var languageLinks = Array.prototype.slice.call(document.querySelectorAll('.lang-switch a'));
  var none = document.querySelector('[data-pro-none]');
  var allowed = buttons.map(function (b) { return b.getAttribute('data-spoken'); });
  var spoken = (new URLSearchParams(window.location.search).get('spoken') || '')
    .split(',')
    .filter(function (v) { return allowed.indexOf(v) !== -1; });

  function render() {
    var shown = 0;
    cards.forEach(function (card) {
      var offers = (card.getAttribute('data-languages') || '').split(' ');
      var match = spoken.length === 0 || spoken.some(function (l) { return offers.indexOf(l) !== -1; });
      card.hidden = !match;
      if (match) shown += 1;
    });
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(spoken.indexOf(b.getAttribute('data-spoken')) !== -1));
    });
    count.textContent = count.getAttribute('data-template')
      .replace('{shown}', String(shown))
      .replace('{total}', String(cards.length));
    none.hidden = shown !== 0;
    // An empty list is not left behind for a screen reader to find, as on /directory.
    list.hidden = shown === 0;

    var url = new URL(window.location.href);
    if (spoken.length) url.searchParams.set('spoken', spoken.join(','));
    else url.searchParams.delete('spoken');
    window.history.replaceState(window.history.state, '', url);

    // Switching language keeps the filter.
    languageLinks.forEach(function (link) {
      var target = new URL(link.getAttribute('href'), window.location.href);
      if (spoken.length) target.searchParams.set('spoken', spoken.join(','));
      else target.searchParams.delete('spoken');
      link.setAttribute('href', target.pathname + target.search);
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var code = b.getAttribute('data-spoken');
      spoken = spoken.indexOf(code) === -1 ? spoken.concat(code) : spoken.filter(function (v) { return v !== code; });
      render();
    });
  });
  none.querySelector('button').addEventListener('click', function () {
    spoken = [];
    render();
    // The button just hid itself. Put focus back at the top of the filter, not on
    // the page body past the list it brought back.
    buttons[0].focus();
  });

  filter.hidden = false;
  render();
  // Live only from here: the first render changes the count's wording, which
  // nobody asked to hear on load.
  count.setAttribute('role', 'status');
})();
