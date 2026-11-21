(() => {
  const products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  const glossyOriginalBase = 'https://adanye-tech.github.io/tile-product-catalog/assets/order-system-products';
  const glossyThumbnailBase = 'https://adanye-tech.github.io/tile-product-catalog/assets/card-thumbs/order-system-products';
  products.forEach(product => {
    if (!product.assetSeries) return;
    product.image = `${glossyOriginalBase}/${product.assetSeries}/main.jpg`;
    product.thumbnail = `${glossyThumbnailBase}/${product.assetSeries}/main.jpg`;
  });
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
  const zoomPrev = document.querySelector('#zoomPrev');
  const zoomNext = document.querySelector('#zoomNext');
  let zoomScale = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let activeGallery = [];
  let activeGalleryIndex = 0;
  let activeProductCode = '';
  const activePointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let activeSize = 'all';
  let activeCategory = 'all';
  let currentLang = localStorage.getItem('hcmCatalogLanguage') || 'vi';

  const translations = {
    vi: {
      brand: 'Kho Hồ Chí Minh<span>Danh mục gạch</span>', headerNote: 'Sản phẩm nhập kho thực tế',
      eyebrow: 'DANH MỤC SẢN PHẨM TRONG KHO', title: 'Kho Hồ Chí Minh<br><em>Danh mục gạch</em>',
      intro: 'Danh mục tập trung các mẫu gạch được ghi nhận trong phiếu nhập kho Hồ Chí Minh.',
      summary: 'mẫu sản phẩm<br>nhập kho thực tế', filtersAria: 'Bộ lọc danh mục', searchLabel: 'Tìm sản phẩm',
      searchPlaceholder: 'Tìm mã sản phẩm...', allSizes: 'Tất cả kích thước', directoryLabel: 'Danh mục sản phẩm', allCatalog: 'Tất cả sản phẩm', glossySeries: 'Dòng gạch bóng', woodSeries: 'Dòng vân gỗ', statusLabel: 'Trạng thái hình ảnh',
      allStatus: 'Tất cả trạng thái', readyStatus: 'Đã có hình ảnh', missingStatus: 'Đang bổ sung hình ảnh',
      empty: 'Không tìm thấy sản phẩm phù hợp.', source: 'Nguồn: phiếu nhập kho thực tế · Không bao gồm sản phẩm thử nghiệm',
      pieces: 'Số viên / thùng', kg: 'KG / thùng', thickness: 'Độ dày', ready: 'Đã có hình ảnh', pending: 'Đang bổ sung hình ảnh',
      products: 'sản phẩm', showingAll: 'Đang hiển thị tất cả mẫu nhập kho', filtered: 'Đã lọc từ các mẫu nhập kho thực tế',
      warehouse: 'KHO HỒ CHÍ MINH', image: 'Hình ảnh sản phẩm', drag: 'Kéo để xem · Cuộn để phóng to', available: 'Đã có', previous: 'Ảnh trước', next: 'Ảnh sau',
      pendingShort: 'Đang bổ sung', close: 'Đóng', zoomOut: 'Thu nhỏ', zoomIn: 'Phóng to', galleryTitle: 'Hình ảnh chi tiết', mainImage: 'Ảnh chính', multiImage: 'Bố cục sản phẩm', effectImage: 'Ảnh hiệu ứng'
    },
    en: {
      brand: 'Ho Chi Minh Warehouse<span>Tile Catalog</span>', headerNote: 'Real inbound product records',
      eyebrow: 'WAREHOUSE PRODUCT DIRECTORY', title: 'Ho Chi Minh Warehouse<br><em>Tile Catalog</em>',
      intro: 'A focused catalog of tile models recorded in the Ho Chi Minh warehouse inbound records.',
      summary: 'real inbound<br>product models', filtersAria: 'Catalog filters', searchLabel: 'Search products',
      searchPlaceholder: 'Search model number...', allSizes: 'All sizes', directoryLabel: 'Product series', allCatalog: 'All products', glossySeries: 'Glossy series', woodSeries: 'Wood-texture series', statusLabel: 'Image status',
      allStatus: 'All image status', readyStatus: 'Image available', missingStatus: 'Image pending',
      empty: 'No matching products found.', source: 'Source: real warehouse inbound records · Test products excluded',
      pieces: 'Pieces / box', kg: 'KG / box', thickness: 'Thickness', ready: 'Image ready', pending: 'Pending image',
      products: 'products', showingAll: 'Showing all inbound models', filtered: 'Filtered from real inbound models',
      warehouse: 'HO CHI MINH WAREHOUSE', image: 'Product image', drag: 'Drag to view · Scroll to zoom', available: 'Available', previous: 'Previous image', next: 'Next image', statusLabel: 'Image status',
      pendingShort: 'Pending', close: 'Close', zoomOut: 'Zoom out', zoomIn: 'Zoom in', galleryTitle: 'Detail images', mainImage: 'Main image', multiImage: 'Product layouts', effectImage: 'Effect images'
    },
    zh: {
      brand: '胡志明仓库<span>瓷砖图册</span>', headerNote: '实际入库产品记录',
      eyebrow: '仓库产品目录', title: '胡志明仓库<br><em>瓷砖图册</em>',
      intro: '本目录收录胡志明仓库正式入库记录中的瓷砖产品。',
      summary: '个产品<br>正式入库记录', filtersAria: '图册筛选', searchLabel: '查找产品',
      searchPlaceholder: '查找产品型号……', allSizes: '所有尺寸', directoryLabel: '产品系列', allCatalog: '所有产品', glossySeries: '亮面瓷砖系列', woodSeries: '木纹系列', statusLabel: '图片状态',
      allStatus: '所有状态', readyStatus: '图片已提供', missingStatus: '待补图片', empty: '没有找到合适的产品。', source: '来源：正式仓库入库记录 · 不包括测试产品',
      pieces: '每盒片剂数量', kg: '公斤 / 箱', thickness: '厚度', ready: '图片已提供', pending: '待补图片', products: '种产品', showingAll: '显示所有库存收据', filtered: '已按正式入库记录筛选',
      warehouse: '胡志明仓库', image: '产品图片', drag: '拖动查看 · 滚轮或双指缩放', available: '图片已提供', previous: '上一张', next: '下一张', pendingShort: '待补图片', close: '关闭', zoomOut: '缩小', zoomIn: '放大', galleryTitle: '图片详情', mainImage: '主图', multiImage: '多版面图', effectImage: '效果图'
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
    zoomPrev?.setAttribute('aria-label', t('previous'));
    zoomNext?.setAttribute('aria-label', t('next'));
    render();
  }

  const display = (value, suffix = '') => value === null || value === '' || Number.isNaN(value) ? '—' : `${value}${suffix}`;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const sizeLabel = (size) => String(size || '').replace('x', '×');
  const galleryFiles = ['main.jpg', 'multi-01.jpg', 'multi-02.jpg', 'multi-03.jpg', 'multi-04.jpg', 'effect-01.jpg', 'effect-02.jpg', 'effect-03.jpg'];
  const productGallery = (product) => product.assetSeries ? galleryFiles.map(file => ({
    file,
    url: `${glossyOriginalBase}/${product.assetSeries}/${file}`,
    thumb: `${glossyThumbnailBase}/${product.assetSeries}/${file}`
  })) : [];

  function card(product, index) {
    const hasImage = Boolean(product.image);
    const image = hasImage
      ? `<img src="${esc(product.thumbnail || product.image)}" data-full-src="${esc(product.image)}" alt="${esc(product.code)}" loading="lazy">`
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
      const isGlossy = product.category === 'glossy-800' || product.category === 'glossy-600';
      const matchesCategory = activeCategory === 'all' || (activeCategory === 'glossy' ? isGlossy : !isGlossy);
      const matchesStatus = status.value === 'all' || (status.value === 'ready' ? Boolean(product.image) : !product.image);
      return matchesQuery && matchesSize && matchesCategory && matchesStatus;
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
    const gallery = productGallery(product);
    const galleryMarkup = gallery.length ? `<section class="product-gallery"><h3>${t('galleryTitle')}</h3><div class="gallery-grid">${gallery.map((item, index) => `<button class="gallery-thumb" type="button" data-gallery-index="${index}"><img src="${esc(item.thumb)}" alt="${esc(product.code)} ${esc(item.file)}" loading="lazy"><span>${index === 0 ? t('mainImage') : item.file.startsWith('multi') ? t('multiImage') : t('effectImage')}</span></button>`).join('')}</div></section>` : '';
    dialogContent.innerHTML = `<div class="dialog-layout"><div class="image-frame${product.image ? '' : ' pending'}">${image}</div><div class="dialog-info"><p class="eyebrow">${t('warehouse')}</p><h2>${esc(product.code)}</h2><div class="product-size">${esc(sizeLabel(product.size))}</div><div class="dialog-spec"><div>${t('pieces')}<strong>${display(product.pieces)}</strong></div><div>${t('kg')}<strong>${display(product.kg)}</strong></div><div>${t('thickness')}<strong>${display(product.thickness, ' mm')}</strong></div><div>${t('statusLabel')}<strong>${product.image ? t('available') : t('pendingShort')}</strong></div></div></div></div>${galleryMarkup}`;
    dialog.showModal();
    const detailImage = dialogContent.querySelector('.image-frame img');
    if (detailImage) {
      detailImage.addEventListener('click', () => openZoom(product, gallery, 0), { once: true });
    }
    dialogContent.querySelectorAll('.gallery-thumb').forEach(button => button.addEventListener('click', () => openZoom(product, gallery, Number(button.dataset.galleryIndex))));
  }

  function renderZoom() {
    zoomImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    const position = activeGallery.length ? ` · ${activeGalleryIndex + 1}/${activeGallery.length}` : '';
    zoomTitle.textContent = `${zoomImage.alt}${position} · ${Math.round(zoomScale * 100)}% · ${t('drag')}`;
    if (zoomPrev) zoomPrev.disabled = activeGalleryIndex <= 0;
    if (zoomNext) zoomNext.disabled = activeGalleryIndex >= activeGallery.length - 1;
  }

  function openZoom(product, gallery = productGallery(product), index = 0) {
    if (!gallery.length && product.image) gallery = [{ file: product.image.split('/').pop(), url: product.image }];
    if (!gallery.length) return;
    activeGallery = gallery;
    activeGalleryIndex = Math.max(0, Math.min(index, gallery.length - 1));
    activeProductCode = product.code;
    zoomScale = 1;
    panX = 0;
    panY = 0;
    const imageUrl = activeGallery[activeGalleryIndex].url;
    zoomImage.src = imageUrl;
    zoomImage.alt = `${product.code} ${imageUrl.split('/').pop()}`;
    renderZoom();
    zoomDialog.showModal();
  }

  function browseZoom(step) {
    const nextIndex = activeGalleryIndex + step;
    if (nextIndex < 0 || nextIndex >= activeGallery.length) return;
    activeGalleryIndex = nextIndex;
    zoomScale = 1;
    panX = 0;
    panY = 0;
    const imageUrl = activeGallery[activeGalleryIndex].url;
    zoomImage.src = imageUrl;
    zoomImage.alt = `${activeProductCode} ${imageUrl.split('/').pop()}`;
    renderZoom();
  }

  document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-size]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    activeSize = button.dataset.size;
    render();
  }));
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-category]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    activeCategory = button.dataset.category;
    activeSize = 'all';
    document.querySelectorAll('[data-size]').forEach(item => item.classList.toggle('active', item.dataset.size === 'all'));
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
  zoomPrev?.addEventListener('click', () => browseZoom(-1));
  zoomNext?.addEventListener('click', () => browseZoom(1));
  document.addEventListener('keydown', event => {
    if (!zoomDialog.open) return;
    if (event.key === 'ArrowLeft') browseZoom(-1);
    if (event.key === 'ArrowRight') browseZoom(1);
  });
  const pointerDistance = () => {
    const points = [...activePointers.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };
  zoomStage.addEventListener('pointerdown', event => {
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    zoomStage.setPointerCapture(event.pointerId);
    if (activePointers.size >= 2) {
      dragging = false;
      pinchStartDistance = pointerDistance();
      pinchStartScale = zoomScale;
      return;
    }
    dragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = panX;
    dragOriginY = panY;
  });
  zoomStage.addEventListener('pointermove', event => {
    if (activePointers.has(event.pointerId)) activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size >= 2) {
      const distance = pointerDistance();
      if (pinchStartDistance && distance) {
        zoomScale = Math.max(.5, Math.min(4, Number((pinchStartScale * distance / pinchStartDistance).toFixed(2))));
        renderZoom();
      }
      return;
    }
    if (!dragging) return;
    panX = dragOriginX + event.clientX - dragStartX;
    panY = dragOriginY + event.clientY - dragStartY;
    renderZoom();
  });
  const endPointer = event => {
    activePointers.delete(event.pointerId);
    dragging = false;
    if (zoomStage.hasPointerCapture(event.pointerId)) zoomStage.releasePointerCapture(event.pointerId);
    if (activePointers.size === 0) {
      pinchStartDistance = 0;
      return;
    }
    if (activePointers.size === 1) {
      const point = [...activePointers.values()][0];
      dragStartX = point.x;
      dragStartY = point.y;
      dragOriginX = panX;
      dragOriginY = panY;
      dragging = true;
    }
  };
  zoomStage.addEventListener('pointerup', endPointer);
  zoomStage.addEventListener('pointercancel', endPointer);
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
