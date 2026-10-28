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
  let currentLang = localStorage.getItem('hcmCatalogLanguage') || 'vi';

  const translations = {
    vi: {
      brand: 'Kho Hồ Chí Minh<span>Danh mục gạch</span>', headerNote: 'Sản phẩm nhập kho thực tế',
      eyebrow: 'DANH MỤC SẢN PHẨM TRONG KHO', title: 'Kho Hồ Chí Minh<br><em>Danh mục gạch</em>',
      intro: 'Danh mục tập trung các mẫu gạch được ghi nhận trong phiếu nhập kho Hồ Chí Minh.',
      summary: 'mẫu sản phẩm<br>nhập kho thực tế', filtersAria: 'Bộ lọc danh mục', searchLabel: 'Tìm sản phẩm',
      searchPlaceholder: 'Tìm mã sản phẩm...', allSizes: 'Tất cả kích thước', statusLabel: 'Trạng thái hình ảnh',
      allStatus: 'Tất cả trạng thái', readyStatus: 'Đã có hình ảnh', missingStatus: 'Đang bổ sung hình ảnh',
      empty: 'Không tìm thấy sản phẩm phù hợp.', source: 'Nguồn: phiếu nhập kho thực tế · Không bao gồm sản phẩm thử nghiệm',
      pieces: 'Số viên / thùng', kg: 'KG / thùng', thickness: 'Độ dày', ready: 'Đã có hình ảnh', pending: 'Đang bổ sung hình ảnh',
      products: 'sản phẩm', showingAll: 'Đang hiển thị tất cả mẫu nhập kho', filtered: 'Đã lọc từ các mẫu nhập kho thực tế',
      warehouse: 'KHO HỒ CHÍ MINH', image: 'Hình ảnh sản phẩm', drag: 'Kéo để xem · Cuộn để phóng to', available: 'Đã có',
      pendingShort: 'Đang bổ sung', close: 'Đóng', zoomOut: 'Thu nhỏ', zoomIn: 'Phóng to'
    },
    en: {
      brand: 'Ho Chi Minh Warehouse<span>Tile Catalog</span>', headerNote: 'Real inbound product records',
      eyebrow: 'WAREHOUSE PRODUCT DIRECTORY', title: 'Ho Chi Minh Warehouse<br><em>Tile Catalog</em>',
      intro: 'A focused catalog of tile models recorded in the Ho Chi Minh warehouse inbound records.',
      summary: 'real inbound<br>product models', filtersAria: 'Catalog filters', searchLabel: 'Search products',
      searchPlaceholder: 'Search model number...', allSizes: 'All sizes', statusLabel: 'Image status',
      allStatus: 'All image status', readyStatus: 'Image available', missingStatus: 'Image pending',
      empty: 'No matching products found.', source: 'Source: real warehouse inbound records · Test products excluded',
      pieces: 'Pieces / box', kg: 'KG / box', thickness: 'Thickness', ready: 'Image ready', pending: 'Pending image',
      products: 'products', showingAll: 'Showing all inbound models', filtered: 'Filtered from real inbound models',
      warehouse: 'HO CHI MINH WAREHOUSE', image: 'Product image', drag: 'Drag to view · Scroll to zoom', available: 'Available',
      pendingShort: 'Pending', close: 'Close', zoomOut: 'Zoom out', zoomIn: 'Zoom in'
    }
  };

  const t = (key) => translations[currentLang][key] || translations.en[key] || key;

  function applyLanguage() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(element => { element.innerHTML = t(element.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => { element.placeholder = t(element.dataset.i18nPlaceholder); });
    const filterSection = document.querySelector('[data-i18n-aria="filtersAria"]');
    if (filterSection) filterSection.setAttribute('aria-label', t('filtersAria'));
    document.querySelectorAll('.language-btn').forEach(button => button.classList.toggle('active', button.dataset.lang === currentLang));
    const closeButton = document.querySelector('#zoomClose');
    if (closeButton) {
      closeButton.innerHTML = `× <span>${t('close')}</span>`;
      closeButton.setAttribute('aria-label', t('close'));
    }
    document.querySelector('#zoomOut')?.setAttribute('aria-label', t('zoomOut'));
    document.querySelector('#zoomIn')?.setAttribute('aria-label', t('zoomIn'));
    render();
  }

  const display = (value, suffix = '') => value === null || value === '' || Number.isNaN(value) ? '—' : `${value}${suffix}`;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const sizeLabel = (size) => String(size || '').replace('x', '×');

  function card(product, index) {
    const hasImage = Boolean(product.image);
    const image = hasImage
      ? `<img src="${esc(product.image)}" alt="${esc(product.code)}" loading="lazy">`
      : `<div class="pending-box">${t('pending')}</div>`;
    return `<article class="product-card" data-index="${index}" tabindex="0">
      <div class="image-frame${hasImage ? '' : ' pending'}">${image}<span class="status-badge">${hasImage ? t('ready') : t('pending')}</span></div>
      <div class="product-info">
        <h2 class="product-code">${esc(product.code)}</h2>
        <div class="product-size">${esc(sizeLabel(product.size))}</div>
        <div class="spec-row"><span>${t('pieces')}</span><span>${display(product.pieces)}</span></div>
        <div class="spec-row"><span>${t('kg')}</span><span>${display(product.kg)}</span></div>
        <div class="spec-row"><span>${t('thickness')}</span><span>${display(product.thickness, ' mm')}</span></div>
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
      frame.insertAdjacentHTML('afterbegin', `<div class="pending-box">${t('pending')}</div>`);
    }, { once: true }));
    resultCount.textContent = `${items.length} ${t('products')}`;
    resultNote.textContent = items.length === products.length ? t('showingAll') : t('filtered');
    empty.hidden = items.length !== 0;
    grid.hidden = items.length === 0;
  }

  function openProduct(product) {
    const image = product.image ? `<img src="${esc(product.image)}" alt="${esc(product.code)}">` : `<div class="pending-box">${t('pending')}</div>`;
    dialogContent.innerHTML = `<div class="dialog-layout"><div class="image-frame${product.image ? '' : ' pending'}">${image}</div><div class="dialog-info"><p class="eyebrow">${t('warehouse')}</p><h2>${esc(product.code)}</h2><div class="product-size">${esc(sizeLabel(product.size))}</div><div class="dialog-spec"><div>${t('pieces')}<strong>${display(product.pieces)}</strong></div><div>${t('kg')}<strong>${display(product.kg)}</strong></div><div>${t('thickness')}<strong>${display(product.thickness, ' mm')}</strong></div><div>${t('statusLabel')}<strong>${product.image ? t('available') : t('pendingShort')}</strong></div></div></div></div>`;
    dialog.showModal();
    const detailImage = dialogContent.querySelector('.image-frame img');
    if (detailImage) {
      detailImage.addEventListener('click', () => openZoom(product), { once: true });
    }
  }

  function renderZoom() {
    zoomImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    zoomTitle.textContent = `${zoomImage.alt} · ${Math.round(zoomScale * 100)}% · ${t('drag')}`;
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
  document.querySelectorAll('.language-btn').forEach(button => button.addEventListener('click', () => {
    currentLang = button.dataset.lang;
    localStorage.setItem('hcmCatalogLanguage', currentLang);
    applyLanguage();
  }));
  document.querySelector('#zoomClose').textContent = `× ${t('close')}`;
  document.querySelector('#zoomClose').setAttribute('aria-label', t('close'));
  document.querySelector('#zoomOut').setAttribute('aria-label', t('zoomOut'));
  document.querySelector('#zoomIn').setAttribute('aria-label', t('zoomIn'));
  document.querySelector('#totalCount').textContent = products.length;
  applyLanguage();
})();
