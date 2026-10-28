(() => {
  const products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  const grid = document.querySelector('#productGrid');
  const search = document.querySelector('#searchInput');
  const status = document.querySelector('#statusFilter');
  const resultCount = document.querySelector('#resultCount');
  const resultNote = document.querySelector('#resultNote');
  const empty = document.querySelector('#emptyState');
  const dialog = document.querySelector('#productDialog');
  const dialogContent = document.querySelector('#dialogContent');
  const zoomDialog = document.querySelector('#zoomDialog');
  const zoomImage = document.querySelector('#zoomImage');
  const zoomTitle = document.querySelector('#zoomTitle');
  const zoomStage = document.querySelector('#zoomStage');
  let zoomScale = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let activeSize = 'all';

  const display = (value, suffix = '') => value === null || value === '' || Number.isNaN(value) ? '—' : `${value}${suffix}`;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const sizeLabel = (size) => String(size || '').replace('x', '×');

  function card(product, index) {
    const hasImage = Boolean(product.image);
    const image = hasImage
      ? `<img src="${esc(product.image)}" alt="${esc(product.code)}" loading="lazy">`
      : '<div class="pending-box">Image pending</div>';
    return `<article class="product-card" data-index="${index}" tabindex="0">
      <div class="image-frame${hasImage ? '' : ' pending'}">${image}${!hasImage ? '' : ''}${!hasImage ? '' : ''}${!hasImage ? '' : ''}<span class="status-badge">${hasImage ? 'Image ready' : 'Pending image'}</span></div>
      <div class="product-info">
        <h2 class="product-code">${esc(product.code)}</h2>
        <div class="product-size">${esc(sizeLabel(product.size))}</div>
        <div class="spec-row"><span>Pieces / box</span><span>${display(product.pieces)}</span></div>
        <div class="spec-row"><span>KG / box</span><span>${display(product.kg)}</span></div>
        <div class="spec-row"><span>Thickness</span><span>${display(product.thickness, ' mm')}</span></div>
      </div>
    </article>`;
  }

  function filtered() {
    const query = search.value.trim().toLowerCase();
    return products.filter(product => {
      const text = `${product.code} ${product.name} ${product.size}`.toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesSize = activeSize === 'all' || product.size === activeSize;
      const matchesStatus = status.value === 'all' || (status.value === 'ready' ? Boolean(product.image) : !product.image);
      return matchesQuery && matchesSize && matchesStatus;
    });
  }

  function render() {
    const items = filtered();
    grid.innerHTML = items.map(product => card(product, products.indexOf(product))).join('');
    grid.querySelectorAll('img').forEach(img => img.addEventListener('error', () => {
      const frame = img.closest('.image-frame');
      img.remove();
      frame.classList.add('pending');
      frame.insertAdjacentHTML('afterbegin', '<div class="pending-box">Image pending</div>');
    }, { once: true }));
    resultCount.textContent = `${items.length} product${items.length === 1 ? '' : 's'}`;
    resultNote.textContent = items.length === products.length ? 'Showing all inbound models' : 'Filtered from real inbound models';
    empty.hidden = items.length !== 0;
    grid.hidden = items.length === 0;
  }

  function openProduct(product) {
    const image = product.image ? `<img src="${esc(product.image)}" alt="${esc(product.code)}">` : '<div class="pending-box">Image pending</div>';
    dialogContent.innerHTML = `<div class="dialog-layout"><div class="image-frame${product.image ? '' : ' pending'}">${image}</div><div class="dialog-info"><p class="eyebrow">HO CHI MINH WAREHOUSE</p><h2>${esc(product.code)}</h2><div class="product-size">${esc(sizeLabel(product.size))}</div><div class="dialog-spec"><div>Pieces / box<strong>${display(product.pieces)}</strong></div><div>KG / box<strong>${display(product.kg)}</strong></div><div>Thickness<strong>${display(product.thickness, ' mm')}</strong></div><div>Image status<strong>${product.image ? 'Available' : 'Pending'}</strong></div></div></div></div>`;
    dialog.showModal();
    const detailImage = dialogContent.querySelector('.image-frame img');
    if (detailImage) {
      detailImage.addEventListener('click', () => openZoom(product), { once: true });
    }
  }

  function renderZoom() {
    zoomImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    zoomTitle.textContent = `${zoomImage.alt} · ${Math.round(zoomScale * 100)}% · Drag to view`;
  }

  function openZoom(product) {
    if (!product.image) return;
    zoomScale = 1;
    panX = 0;
    panY = 0;
    zoomImage.src = product.image;
    zoomImage.alt = product.code;
    renderZoom();
    zoomDialog.showModal();
  }

  document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-size]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    activeSize = button.dataset.size;
    render();
  }));
  search.addEventListener('input', render);
  status.addEventListener('change', render);
  grid.addEventListener('click', event => { const cardEl = event.target.closest('.product-card'); if (cardEl) openProduct(products[Number(cardEl.dataset.index)]); });
  grid.addEventListener('keydown', event => { if (event.key === 'Enter') { const cardEl = event.target.closest('.product-card'); if (cardEl) openProduct(products[Number(cardEl.dataset.index)]); } });
  document.querySelector('#dialogClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.querySelector('#zoomClose').addEventListener('click', () => zoomDialog.close());
  document.querySelector('#zoomIn').addEventListener('click', () => { zoomScale = Math.min(4, zoomScale + .25); renderZoom(); });
  document.querySelector('#zoomOut').addEventListener('click', () => { zoomScale = Math.max(.5, zoomScale - .25); renderZoom(); });
  document.querySelector('#zoomReset').addEventListener('click', () => { zoomScale = 1; panX = 0; panY = 0; renderZoom(); });
  zoomStage.addEventListener('pointerdown', event => {
    dragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = panX;
    dragOriginY = panY;
    zoomStage.setPointerCapture(event.pointerId);
  });
  zoomStage.addEventListener('pointermove', event => {
    if (!dragging) return;
    panX = dragOriginX + event.clientX - dragStartX;
    panY = dragOriginY + event.clientY - dragStartY;
    renderZoom();
  });
  zoomStage.addEventListener('pointerup', event => { dragging = false; zoomStage.releasePointerCapture(event.pointerId); });
  zoomStage.addEventListener('pointercancel', () => { dragging = false; });
  zoomStage.addEventListener('wheel', event => {
    event.preventDefault();
    const next = Math.max(.5, Math.min(4, zoomScale + (event.deltaY < 0 ? .15 : -.15)));
    zoomScale = Number(next.toFixed(2));
    renderZoom();
  }, { passive: false });
  zoomDialog.addEventListener('click', event => { if (event.target === zoomDialog) zoomDialog.close(); });
  document.querySelector('#totalCount').textContent = products.length;
  render();
})();
