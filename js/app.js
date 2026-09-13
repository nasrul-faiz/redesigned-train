/* =========================================================
   DocBook — a lightweight GitBook-style docs app
   Data model, persisted in localStorage, no backend needed.
   ========================================================= */
import '../css/style.css';
import 'lightgallery.js/dist/css/lightgallery.css';
import 'lightgallery.js/dist/js/lightgallery.js';
import 'lg-thumbnail.js/dist/lg-thumbnail.js';
import 'lg-zoom.js/dist/lg-zoom.js';
import { marked } from 'marked';
import {
  DEFAULT_BOOK_TITLE,
  DEFAULT_TABLE_SETTINGS,
  normalizeBookTitle,
  normalizeDocumentState,
  normalizeTableSettings
} from '../src/data-store.js';
import {
  buildChartArcPath,
  getChartFractions,
  normalizeChartDefinition,
  parseChartDefinition,
  serializeChartBlock
} from '../src/chart-markdown.js';
import { getDefaultEditorToolMode } from '../src/edit-mode.js';
import { parseMarkdownImages, serializeMarkdownImage } from '../src/media-markdown.js';
import { buildFileAttachmentCard, sanitizeFileName, serializeFileLink } from '../src/file-markdown.js';
import { buildMapMarkup, parseLocationInput } from '../src/map-markdown.js';

const STORAGE_KEY = 'docbook_data_v1';
const THEME_KEY = 'docbook_theme';
const EDIT_KEY = 'docbook_edit_mode';
const SIDEBAR_KEY = 'docbook_sidebar_collapsed';
const LANG_KEY = 'docbook_language';

const translations = {
  ms: {
    settings: 'Tetapan',
    share: 'Kongsi',
    sharePage: 'Kongsi halaman',
    shareHint: 'Salin pautan halaman ini untuk dikongsi.',
    shareLink: 'Pautan halaman',
    copyLink: 'Salin pautan',
    copiedLink: 'Pautan disalin',
    nativeShare: 'Kongsi melalui peranti',
    general: 'Umum',
    appearance: 'Penampilan',
    tableSettings: 'Jadual',
    generalDescription: 'Urus identiti dan bahasa RecipeBook anda.',
    appearanceDescription: 'Sesuaikan rupa dan cara anda menggunakan RecipeBook.',
    tableSettingsDescription: 'Tetapkan warna tajuk dan alignment teks untuk semua jadual.',
    languageDescription: 'Pilih bahasa yang digunakan dalam antara muka.',
    bookTitleDescription: 'Nama ini dipaparkan pada penjuru kiri atas.',
    editModeDescription: 'Tunjukkan kawalan untuk menyunting kandungan dan menu.',
    themeDescription: 'Pilih tema yang selesa untuk digunakan.',
    language: 'Bahasa',
    bookTitle: 'Nama RecipeBook',
    theme: 'Tema',
    tableHeaderColor: 'Warna tajuk jadual',
    tableHeaderColorDescription: 'Warna baris tajuk untuk semua jadual.',
    tableTextAlign: 'Alignment teks',
    alignLeft: 'Kiri',
    alignCenter: 'Tengah',
    alignRight: 'Kanan',
    editMode: 'Mod edit',
    light: 'Terang',
    dark: 'Gelap',
    close: 'Tutup',
    cancel: 'Batal',
    delete: 'Padam',
    ok: 'OK',
    save: 'Simpan',
    searchPlaceholder: 'Cari dokumen…',
    searchNotFound: 'Search for "{query}" not found',
    searchSuggestion: 'Try a different keyword or check your spelling.',
    addMenu: 'Tambah Menu',
    addSubmenu: 'Tambah Submenu',
    rename: 'Namakan semula',
    moveUp: 'Alih ke atas',
    moveDown: 'Alih ke bawah',
    expandSubmenu: 'Buka submenu',
    collapseSubmenu: 'Tutup submenu',
    duplicate: 'Duplikasi',
    deleteNode: 'Padam',
    confirmAction: 'Sahkan Tindakan',
    noPageSelected: 'Tiada halaman dipilih',
    noPageSelectedHint: 'Pilih halaman dari sidebar, atau tambah menu baharu dalam Edit Mode.',
    editContent: 'Edit Kandungan',
    lastUpdatedJustNow: 'Terakhir dikemas kini sebentar tadi',
    lastUpdatedMinutes: 'Terakhir dikemas kini {count} minit yang lalu',
    lastUpdatedHours: 'Terakhir dikemas kini {count} jam yang lalu',
    lastUpdatedDays: 'Terakhir dikemas kini {count} hari yang lalu',
    lastUpdatedDate: 'Terakhir dikemas kini {date}',
    prev: 'Sebelumnya',
    next: 'Seterusnya',
    markdownSupported: 'Markdown disokong',
    editorHint: 'Tulis kandungan dalam Markdown dan gunakan toolbar sebagai jalan pintas.',
    editorReady: 'Tiada perubahan belum disimpan',
    editorUnsaved: 'Ada perubahan belum disimpan',
    characters: 'aksara',
    editorToolbar: 'Toolbar',
    switchToolGroup: 'Tukar kategori toolbar',
    textTools: 'Teks',
    blockTools: 'Blok',
    calloutTools: 'Callout',
    mediaTools: 'Media',
    chart: 'Chart',
    insertChart: 'Masukkan chart',
    insertMap: 'Masukkan map',
    mapBuilderTitle: 'Tambah map',
    mapLabel: 'Nama lokasi',
    mapLatitude: 'Latitude',
    mapLongitude: 'Longitude',
    mapLink: 'Link lokasi',
    mapLinkHint: 'Boleh isi link Google Maps atau OpenStreetMap untuk isi koordinat automatik.',
    useCurrentLocation: 'Gunakan lokasi semasa',
    mapNeedLocation: 'Sila isi latitude dan longitude, atau link lokasi yang mengandungi koordinat.',
    locationUnavailable: 'Lokasi semasa tidak tersedia. Sila semak izin browser.',
    returnToLocation: 'Kembali ke lokasi asal',
    copyCoordinates: 'Salin koordinat',
    coordinatesCopied: 'Koordinat disalin',
    confirmDeleteMap: 'Padam map ini daripada kandungan?',
    chartBuilderHint: 'Masukkan data anda sendiri dan pilih bentuk chart yang sesuai.',
    chartTitle: 'Tajuk chart',
    chartType: 'Jenis chart',
    chartData: 'Data chart',
    chartLabel: 'Label',
    chartValue: 'Nilai',
    addData: 'Tambah data',
    removeData: 'Buang',
    chartPreview: 'Preview chart',
    chartBar: 'Bar',
    chartLine: 'Line',
    chartPie: 'Pie',
    chartDoughnut: 'Donut / Circle',
    chartPolar: 'Polar Area',
    chartRadar: 'Radar',
    chartNeedData: 'Masukkan sekurang-kurangnya dua data yang sah.',
    confirmDeleteChart: 'Padam chart ini daripada kandungan?',
    title: 'Tajuk',
    bold: 'Tebal',
    italic: 'Italik',
    list: 'Senarai',
    checklist: 'Checklist',
    link: 'Pautan',
    code: 'Kod',
    table: 'Jadual',
    tip: 'Tip',
    info: 'Info',
    note: 'Note',
    warning: 'Warning',
    important: 'Important',
    success: 'Success',
    danger: 'Danger',
    quote: 'Quote',
    uploadMedia: 'Muat naik gambar',
    insertFile: 'Masukkan fail',
    fileUploadTitle: 'Lampirkan fail',
    fileUploadHint: 'Tambah satu fail ke halaman sebagai pautan Markdown.',
    fileUrl: 'URL fail',
    fileName: 'Nama fail',
    fileLinkReady: 'Fail ditambah ke kandungan.',
    invalidFile: 'Sila pilih fail yang sah.',
    imageUrl: 'URL imej',
    imageName: 'Nama imej',
    defaultImageCaption: 'Imej',
    imageUrlPlaceholder: 'https://contoh.com/gambar.jpg',
    imageNamePlaceholder: 'Nama atau caption imej',
    insertImage: 'Masukkan URL',
    mediaManager: 'Imej dalam halaman',
    mediaManagerHint: 'Setiap imej akan disimpan sebagai satu baris Markdown.',
    editImage: 'Edit imej',
    addCaption: 'Caption',
    replaceImage: 'Ganti imej',
    replacementUrl: 'URL imej baharu',
    chooseImage: 'Pilih imej',
    deleteImage: 'Padam imej',
    confirmDeleteImage: 'Padam imej ini daripada kandungan?',
    noImages: 'Belum ada imej dalam halaman ini.',
    invalidImageUrl: 'Sila masukkan URL imej yang sah.',
    invalidImageFile: 'Sila pilih fail imej yang sah.',
    imageReady: 'Imej ditambah ke kandungan.',
    imageUpdated: 'Imej dikemas kini.',
    imageDeleted: 'Imej dipadam.',
    fileSelected: 'Fail dipilih',
    uploadingImage: 'Sedang memuat naik imej ke ImgBB…',
    uploadMediaTitle: 'Muat naik media',
    uploadMediaHint: 'Pilih fail image atau masukkan URL image untuk dimasukkan ke halaman.',
    selectFile: 'Pilih fail',
    noFileSelected: 'Belum ada fail dipilih.',
    noMediaSelected: 'Pilih fail atau masukkan URL image.',
    or: 'atau',
    addImage: 'Tambah image',
    upload: 'Muat naik',
    uploadTab: 'Upload',
    imageListTab: 'Senarai image',
    moreImages: '+{count} imej lagi',
    preview: 'Preview',
    backToEditor: 'Kembali ke editor',
    seeMore: 'Lihat lagi',
    seeLess: 'Lihat kurang',
    copy: 'Salin',
    copied: 'Disalin'
  },
  en: {
    settings: 'Settings',
    share: 'Share',
    sharePage: 'Share page',
    shareHint: 'Copy this page link to share it.',
    shareLink: 'Page link',
    copyLink: 'Copy link',
    copiedLink: 'Link copied',
    nativeShare: 'Share from device',
    general: 'General',
    appearance: 'Appearance',
    tableSettings: 'Table',
    generalDescription: 'Manage your RecipeBook identity and language.',
    appearanceDescription: 'Customize how your RecipeBook looks and feels.',
    tableSettingsDescription: 'Set the header color and text alignment for all tables.',
    languageDescription: 'Choose the language used across the interface.',
    bookTitleDescription: 'This name appears in the top-left corner.',
    editModeDescription: 'Show controls for editing content and navigation.',
    themeDescription: 'Choose a theme that feels comfortable to use.',
    language: 'Language',
    bookTitle: 'RecipeBook name',
    theme: 'Theme',
    tableHeaderColor: 'Table header color',
    tableHeaderColorDescription: 'Color used for the header row in all tables.',
    tableTextAlign: 'Text alignment',
    alignLeft: 'Left',
    alignCenter: 'Center',
    alignRight: 'Right',
    editMode: 'Edit mode',
    light: 'Light',
    dark: 'Dark',
    close: 'Close',
    cancel: 'Cancel',
    delete: 'Delete',
    ok: 'OK',
    save: 'Save',
    searchPlaceholder: 'Search documents…',
    searchNotFound: 'Search for "{query}" not found',
    searchSuggestion: 'Try a different keyword or check your spelling.',
    addMenu: 'Add Menu',
    addSubmenu: 'Add Submenu',
    rename: 'Rename',
    moveUp: 'Move up',
    moveDown: 'Move down',
    expandSubmenu: 'Open submenu',
    collapseSubmenu: 'Close submenu',
    duplicate: 'Duplicate',
    deleteNode: 'Delete',
    confirmAction: 'Confirm Action',
    noPageSelected: 'No page selected',
    noPageSelectedHint: 'Choose a page from the sidebar, or add a new menu in Edit Mode.',
    editContent: 'Edit Content',
    lastUpdatedJustNow: 'Last updated just now',
    lastUpdatedMinutes: 'Last updated {count} minutes ago',
    lastUpdatedHours: 'Last updated {count} hours ago',
    lastUpdatedDays: 'Last updated {count} days ago',
    lastUpdatedDate: 'Last updated {date}',
    prev: 'Previous',
    next: 'Next',
    markdownSupported: 'Markdown supported',
    editorHint: 'Write in Markdown or use the toolbar as a shortcut.',
    editorReady: 'No unsaved changes',
    editorUnsaved: 'Unsaved changes',
    characters: 'characters',
    editorToolbar: 'Toolbar',
    switchToolGroup: 'Switch toolbar category',
    textTools: 'Text',
    blockTools: 'Blocks',
    calloutTools: 'Callouts',
    mediaTools: 'Media',
    chart: 'Chart',
    insertChart: 'Insert chart',
    insertMap: 'Insert map',
    mapBuilderTitle: 'Add map',
    mapLabel: 'Location name',
    mapLatitude: 'Latitude',
    mapLongitude: 'Longitude',
    mapLink: 'Location link',
    mapLinkHint: 'Paste a Google Maps or OpenStreetMap link to fill coordinates automatically.',
    useCurrentLocation: 'Use current location',
    mapNeedLocation: 'Enter latitude and longitude, or a location link containing coordinates.',
    locationUnavailable: 'Current location is unavailable. Check the browser permission.',
    returnToLocation: 'Return to original location',
    copyCoordinates: 'Copy coordinates',
    coordinatesCopied: 'Coordinates copied',
    confirmDeleteMap: 'Delete this map from the content?',
    chartBuilderHint: 'Enter your own data and choose the chart style that fits.',
    chartTitle: 'Chart title',
    chartType: 'Chart type',
    chartData: 'Chart data',
    chartLabel: 'Label',
    chartValue: 'Value',
    addData: 'Add data',
    removeData: 'Remove',
    chartPreview: 'Chart preview',
    chartBar: 'Bar',
    chartLine: 'Line',
    chartPie: 'Pie',
    chartDoughnut: 'Donut / Circle',
    chartPolar: 'Polar Area',
    chartRadar: 'Radar',
    chartNeedData: 'Enter at least two valid data points.',
    confirmDeleteChart: 'Delete this chart from the content?',
    title: 'Title',
    bold: 'Bold',
    italic: 'Italic',
    list: 'List',
    checklist: 'Checklist',
    link: 'Link',
    code: 'Code',
    table: 'Table',
    tip: 'Tip',
    info: 'Info',
    note: 'Note',
    warning: 'Warning',
    important: 'Important',
    success: 'Success',
    danger: 'Danger',
    quote: 'Quote',
    uploadMedia: 'Upload image',
    insertFile: 'Insert file',
    fileUploadTitle: 'Attach a file',
    fileUploadHint: 'Add a file to the page as a Markdown link.',
    fileUrl: 'File URL',
    fileName: 'File name',
    fileLinkReady: 'File added to the content.',
    invalidFile: 'Please choose a valid file.',
    imageUrl: 'Image URL',
    imageName: 'Image name',
    defaultImageCaption: 'Image',
    imageUrlPlaceholder: 'https://example.com/image.jpg',
    imageNamePlaceholder: 'Image name or caption',
    insertImage: 'Insert URL',
    mediaManager: 'Images in this page',
    mediaManagerHint: 'Each image is stored as one Markdown line.',
    editImage: 'Edit image',
    addCaption: 'Caption',
    replaceImage: 'Replace image',
    replacementUrl: 'New image URL',
    chooseImage: 'Choose image',
    deleteImage: 'Delete image',
    confirmDeleteImage: 'Delete this image from the content?',
    noImages: 'There are no images in this page yet.',
    invalidImageUrl: 'Please enter a valid image URL.',
    invalidImageFile: 'Please choose a valid image file.',
    imageReady: 'Image added to the content.',
    imageUpdated: 'Image updated.',
    imageDeleted: 'Image deleted.',
    fileSelected: 'File selected',
    uploadingImage: 'Uploading image to ImgBB…',
    uploadMediaTitle: 'Upload media',
    uploadMediaHint: 'Choose an image file or enter an image URL to add to this page.',
    selectFile: 'Choose file',
    noFileSelected: 'No file selected yet.',
    noMediaSelected: 'Choose a file or enter an image URL.',
    or: 'or',
    addImage: 'Add image',
    upload: 'Upload',
    uploadTab: 'Upload',
    imageListTab: 'Image list',
    moreImages: '+{count} more images',
    preview: 'Preview',
    backToEditor: 'Back to editor',
    seeMore: 'See more',
    seeLess: 'See less',
    copy: 'Copy',
    copied: 'Copied'
  }
};

let state = {
  activeId: null,
  pages: [], // tree: { id, title, content, children: [] }
  bookTitle: DEFAULT_BOOK_TITLE,
  tableSettings: { ...DEFAULT_TABLE_SETTINGS }
};

/* ---------- Default seed content ---------- */
function seedData() {
  return [
    {
      id: uid(), title: 'Pengenalan', children: [],
      content: `# Selamat Datang 👋

Ini adalah **DocBook**, sistem dokumentasi moden bergaya GitBook.

- Klik **Edit Mode** di penjuru atas untuk mula menyunting
- Guna butang **+** pada sidebar untuk tambah menu / submenu
- Tulis kandungan dalam format **Markdown**

> Semua perubahan disimpan automatik pada pelayar anda (localStorage).`
    },
    {
      id: uid(), title: 'Panduan Bermula', children: [
        {
          id: uid(), title: 'Pasang', children: [],
          content: `## Pasang DocBook\n\nTiada pemasangan diperlukan — cuma buka \`index.html\` dalam pelayar.`
        },
        {
          id: uid(), title: 'Konfigurasi', children: [],
          content: `## Konfigurasi\n\nUbah suai struktur menu terus dari sidebar semasa **Edit Mode** aktif.`
        }
      ],
      content: `# Panduan Bermula\n\nBahagian ini mengandungi submenu untuk membantu anda bermula.`
    },
    {
      id: uid(), title: 'Rujukan API', children: [],
      content: `# Rujukan API\n\n\`\`\`js\nfunction hello() {\n  console.log("Hello DocBook!");\n}\n\`\`\``
    }
  ];
}

function uid() {
  return 'p_' + Math.random().toString(36).slice(2, 10);
}

/* ---------- Persistence ---------- */
function ensurePageTimestamps(nodes, fallback = Date.now()) {
  let changed = false;
  (nodes || []).forEach((node) => {
    const timestamp = typeof node.updatedAt === 'number'
      ? node.updatedAt
      : Date.parse(node.updatedAt || '');
    if (!Number.isFinite(timestamp)) {
      node.updatedAt = fallback;
      changed = true;
    } else if (node.updatedAt !== timestamp) {
      node.updatedAt = timestamp;
      changed = true;
    }
    if (ensurePageTimestamps(node.children, fallback)) changed = true;
  });
  return changed;
}

function touchNode(node) {
  if (node) node.updatedAt = Date.now();
}

function getSharedPageId() {
  const queryPageId = new URLSearchParams(window.location.search).get('page');
  if (queryPageId) return queryPageId;
  return new URLSearchParams(window.location.hash.slice(1)).get('page');
}

function syncSharedPageUrl(pageId) {
  if (!pageId || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.hash = new URLSearchParams({ page: pageId }).toString();
  window.history.replaceState(null, '', url);
}

async function loadState() {
  const applyLoadedState = (normalized) => {
    state.pages = normalized.pages;
    state.activeId = normalized.activeId;
    state.bookTitle = normalized.bookTitle;
    state.tableSettings = normalized.tableSettings;
    const sharedPageId = getSharedPageId();
    if (sharedPageId && findNode(sharedPageId, state.pages)) state.activeId = sharedPageId;
  };

  try {
    const response = await fetch('/api/docbook', {
      headers: { Accept: 'application/json' }
    });

    if (response.ok) {
      const parsed = await response.json();
      const normalized = normalizeDocumentState(parsed);
      applyLoadedState(normalized);
      if (ensurePageTimestamps(state.pages)) saveState();
      return;
    }
  } catch (error) {
    console.warn('Database API unavailable, falling back to localStorage.', error);
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const normalized = normalizeDocumentState(parsed);
      applyLoadedState(normalized);
      if (ensurePageTimestamps(state.pages)) saveState();
      return;
    } catch (error) {
      console.warn('Invalid local state, rebuilding default data.', error);
    }
  }

  const normalized = normalizeDocumentState({ pages: null, activeId: null, bookTitle: null });
  applyLoadedState(normalized);
  ensurePageTimestamps(state.pages);
  saveState();
}

let remoteSaveQueue = Promise.resolve();

function saveState() {
  const payload = {
    pages: state.pages,
    activeId: state.activeId,
    bookTitle: normalizeBookTitle(state.bookTitle),
    tableSettings: normalizeTableSettings(state.tableSettings)
  };
  const serialized = JSON.stringify(payload);
  localStorage.setItem(STORAGE_KEY, serialized);

  remoteSaveQueue = remoteSaveQueue
    .catch(() => undefined)
    .then(() => fetch('/api/docbook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: serialized
    }))
    .then((response) => {
      if (!response.ok) throw new Error(`Remote save failed with ${response.status}`);
    })
    .catch((error) => {
      console.warn('Remote save unavailable; local copy remains saved.', error);
    });

  return remoteSaveQueue;
}

/* ---------- Tree helpers ---------- */
function findNode(id, nodes = state.pages) {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(id, n.children);
    if (found) return found;
  }
  return null;
}

function findParentArray(id, nodes = state.pages) {
  for (const n of nodes) {
    if (n.id === id) return nodes;
    const found = findParentArray(id, n.children);
    if (found) return found;
  }
  return null;
}

function findPath(id, nodes = state.pages, path = []) {
  for (const node of nodes) {
    const nextPath = [...path, node];
    if (node.id === id) return nextPath;
    const found = findPath(id, node.children, nextPath);
    if (found) return found;
  }
  return null;
}

function removeNode(id) {
  const arr = findParentArray(id);
  if (!arr) return;
  const idx = arr.findIndex(n => n.id === id);
  if (idx !== -1) arr.splice(idx, 1);
}

function flattenSearch(nodes = state.pages, out = []) {
  for (const n of nodes) {
    out.push(n);
    flattenSearch(n.children, out);
  }
  return out;
}

function duplicateNode(node) {
  return {
    id: uid(),
    title: `${node.title} (salinan)`,
    content: node.content || '',
    children: node.children.map(duplicateNode),
    updatedAt: Date.now()
  };
}

function moveNode(id, direction) {
  const siblings = findParentArray(id);
  if (!siblings) return;
  const index = siblings.findIndex(node => node.id === id);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return;
  [siblings[index], siblings[targetIndex]] = [siblings[targetIndex], siblings[index]];
  saveState();
  renderTree();
}

/* ---------- DOM refs ---------- */
const menuTreeEl = document.getElementById('menuTree');
const contentEl = document.getElementById('content');
const tplTreeItem = document.getElementById('tpl-tree-item');
const sidebarEl = document.getElementById('sidebar');
const searchInput = document.getElementById('searchInput');

/* ---------- Rendering: sidebar tree ---------- */
function renderTree() {
  menuTreeEl.innerHTML = '';
  state.pages.forEach(node => menuTreeEl.appendChild(renderTreeNode(node)));
}

function renderTreeNode(node) {
  const frag = tplTreeItem.content.cloneNode(true);
  const item = frag.querySelector('.tree-item');
  const row = frag.querySelector('.tree-row');
  const label = frag.querySelector('.tree-label');
  const childrenEl = frag.querySelector('.tree-children');
  const caret = frag.querySelector('.toggle-caret');

  item.dataset.id = node.id;
  label.textContent = node.title;
  if (node.id === state.activeId) row.classList.add('active');
  if (!node.children.length) item.classList.add('no-children');
  if (node._expanded) item.classList.add('expanded');

  const childrenInner = document.createElement('div');
  childrenInner.className = 'tree-children-inner';
  node.children.forEach(child => childrenInner.appendChild(renderTreeNode(child)));
  childrenEl.appendChild(childrenInner);
  caret.setAttribute('aria-expanded', String(!!node._expanded));
  caret.setAttribute('aria-label', node._expanded ? getText('collapseSubmenu') : getText('expandSubmenu'));
  caret.disabled = !node.children.length;

  caret.addEventListener('click', (e) => {
    e.stopPropagation();
    node._expanded = !node._expanded;
    saveState();
    renderTree();
  });

  row.addEventListener('click', () => {
    state.activeId = node.id;
    node._expanded = true;
    saveState();
    renderTree();
    renderContent();
  });

  frag.querySelector('.act-add-child').setAttribute('title', getText('addSubmenu'));
  frag.querySelector('.act-add-child').addEventListener('click', (e) => {
    e.stopPropagation();
    promptModal(getText('addSubmenu'), 'Nama submenu', '', (title) => {
      if (!title) return;
      const newNode = { id: uid(), title, content: `# ${title}\n\nTulis kandungan di sini…`, children: [], updatedAt: Date.now() };
      node.children.push(newNode);
      node._expanded = true;
      state.activeId = newNode.id;
      saveState();
      renderTree();
      renderContent();
    });
  });

  frag.querySelector('.act-rename').setAttribute('title', getText('rename'));
  frag.querySelector('.act-rename').addEventListener('click', (e) => {
    e.stopPropagation();
    promptModal(getText('rename'), 'Nama baharu', node.title, (title) => {
      if (!title) return;
      node.title = title;
      touchNode(node);
      saveState();
      renderTree();
      renderContent();
    });
  });

  frag.querySelector('.act-up').setAttribute('title', getText('moveUp'));
  frag.querySelector('.act-up').addEventListener('click', (e) => {
    e.stopPropagation();
    moveNode(node.id, 'up');
  });

  frag.querySelector('.act-down').setAttribute('title', getText('moveDown'));
  frag.querySelector('.act-down').addEventListener('click', (e) => {
    e.stopPropagation();
    moveNode(node.id, 'down');
  });

  frag.querySelector('.act-duplicate').setAttribute('title', getText('duplicate'));
  frag.querySelector('.act-duplicate').addEventListener('click', (e) => {
    e.stopPropagation();
    const siblings = findParentArray(node.id);
    const index = siblings.findIndex(item => item.id === node.id);
    const copy = duplicateNode(node);
    siblings.splice(index + 1, 0, copy);
    state.activeId = copy.id;
    saveState();
    renderTree();
    renderContent();
  });

  frag.querySelector('.act-delete').setAttribute('title', getText('deleteNode'));
  frag.querySelector('.act-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    confirmModal(`${getText('deleteNode')} "${node.title}" dan semua submenunya?`, () => {
      const wasActive = (state.activeId === node.id) || !!findNode(state.activeId, node.children);
      removeNode(node.id);
      if (wasActive) {
        const all = flattenSearch();
        state.activeId = all.length ? all[0].id : null;
      }
      saveState();
      renderTree();
      renderContent();
    });
  });

  return item;
}

/* ---------- Rendering: main content ---------- */
function renderContent() {
  const node = state.activeId ? findNode(state.activeId) : null;

  if (!node) {
    contentEl.innerHTML = `
      <div class="empty-state">
        <div class="big-icon">📄</div>
        <h2>${getText('noPageSelected')}</h2>
        <p>${getText('noPageSelectedHint')}</p>
      </div>`;
    return;
  }

  syncSharedPageUrl(node.id);
  const path = findPath(node.id) || [node];
  const allPages = flattenSearch();
  const currentIndex = allPages.findIndex(page => page.id === node.id);
  const previous = allPages[currentIndex - 1];
  const next = allPages[currentIndex + 1];

  const breadcrumbEl = document.getElementById('topbarBreadcrumb');
  if (breadcrumbEl) {
    breadcrumbEl.innerHTML = path.map((crumb, index) => `<span class="crumb-link" data-crumb-id="${crumb.id}">${escapeHtml(crumb.title)}</span>${index < path.length - 1 ? '<span class="crumb-sep">/</span>' : ''}`).join('');
  }

  contentEl.innerHTML = `
    <div class="page-header">
      <h1 class="page-title" id="pageTitle">${escapeHtml(node.title)}</h1>
      <div class="page-actions edit-only">
        <button class="btn btn-primary" id="btnEditContent">✎ ${getText('editContent')}</button>
      </div>
    </div>
    <div class="page-meta">${formatLastUpdated(node)}</div>
    <div class="doc-layout">
      <div class="doc-main">
        <div class="markdown-body" id="pageBody"></div>
      </div>
      <aside class="doc-toc" id="docToc"></aside>
    </div>
    <footer class="page-footer">
      <div class="prev-next-nav">
        ${previous ? `<a class="pn-link previous" data-page-id="${previous.id}"><span class="pn-label">← ${getText('prev')}</span><span class="pn-title">${escapeHtml(previous.title)}</span></a>` : ''}
        ${next ? `<a class="pn-link next" data-page-id="${next.id}"><span class="pn-label">${getText('next')} →</span><span class="pn-title">${escapeHtml(next.title)}</span></a>` : ''}
      </div>
    </footer>
  `;

  const pageBody = document.getElementById('pageBody');
  const normalizedContent = removeEphemeralMediaSources(normalizeLegacyMediaContent(node.content || ''));
  if (normalizedContent !== (node.content || '')) {
    node.content = normalizedContent;
    touchNode(node);
    saveState();
  }
  pageBody.innerHTML = /^\s*</.test(normalizedContent)
    ? sanitizeRenderedHtml(normalizedContent)
    : renderMarkdown(normalizedContent);
  hydrateCharts(pageBody);
  enhanceDocumentPage(pageBody);

  const titleEl = document.getElementById('pageTitle');
  document.getElementById('btnEditContent').addEventListener('click', () => renderEditor(node));

  // Inline title editing while in edit mode
  titleEl.addEventListener('blur', () => {
    if (!document.body.classList.contains('edit-mode')) return;
    const newTitle = titleEl.textContent.trim();
    if (newTitle && newTitle !== node.title) {
      node.title = newTitle;
        touchNode(node);
      saveState();
      renderTree();
    }
  });

  applyEditModeToTitle(node);
}

function sanitizeRenderedHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = String(html || '');
  const textWalker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const literalHtmlNodes = [];
  while (textWalker.nextNode()) literalHtmlNodes.push(textWalker.currentNode);
  literalHtmlNodes.forEach((textNode) => {
    if (!/&lt;\/?(?:div|img|figure)\b/i.test(textNode.nodeValue || '')) return;
    const decoder = document.createElement('textarea');
    decoder.innerHTML = textNode.nodeValue;
    const decoded = decoder.value;
    if (!/(?:media-gallery|file-attachment-card|<img\b)/i.test(decoded)) return;
    const fragment = document.createRange().createContextualFragment(decoded);
    textNode.replaceWith(fragment);
  });
  template.content
    .querySelectorAll('script, style, object, embed, form, input, button, textarea, select, link, meta, base, svg:not(.doc-chart-svg), math')
    .forEach((element) => element.remove());
  template.content.querySelectorAll('iframe').forEach((iframe) => {
    const src = iframe.getAttribute('src') || '';
    let isAllowedMap = false;
    try {
      const url = new URL(src, window.location.href);
      isAllowedMap = iframe.closest('.doc-map')
        && url.protocol === 'https:'
        && url.hostname === 'www.openstreetmap.org'
        && url.pathname === '/export/embed.html';
    } catch {
      isAllowedMap = false;
    }
    if (!isAllowedMap) iframe.remove();
  });

  template.content.querySelectorAll('.file-attachment-card').forEach((card) => {
    const imageLink = card.querySelector('.file-attachment-open[href]');
    const imageSource = imageLink?.getAttribute('href') || '';
    if (!isLikelyImageUrl(imageSource)) return;
    const image = document.createElement('img');
    image.src = imageSource;
    image.alt = card.dataset.fileName || 'Imej';
    card.replaceWith(image);
  });

  template.content.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || name === 'style' || name === 'srcdoc') {
        element.removeAttribute(attribute.name);
      }
    });

    ['href', 'src', 'poster'].forEach((attributeName) => {
      const value = element.getAttribute(attributeName);
      if (!value) return;
      const trimmed = value.trim();
      if (trimmed.startsWith('#')) return;
      try {
        const url = new URL(trimmed, window.location.href);
        const allowedProtocol = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'].includes(url.protocol)
          || (url.protocol === 'data:' && /^data:image\//i.test(trimmed));
        if (!allowedProtocol) element.removeAttribute(attributeName);
      } catch {
        element.removeAttribute(attributeName);
      }
    });

    if (element.tagName === 'A' && element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return template.innerHTML;
}

const CHART_COLORS = ['#2f6fed', '#16a34a', '#f59e0b', '#e5484d', '#8b5cf6', '#0891b2', '#ec4899', '#64748b'];

function formatChartNumber(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function shortChartLabel(label, maxLength = 15) {
  const value = String(label || '');
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function chartPoint(cx, cy, radius, angle) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  };
}

function chartLegend(chart) {
  return `<div class="doc-chart-legend">${chart.labels.map((label, index) => `
    <span class="doc-chart-legend-item"><i style="background:${CHART_COLORS[index % CHART_COLORS.length]}"></i>${escapeHtml(label)}</span>
  `).join('')}</div>`;
}

function renderCartesianChart(chart) {
  const width = 720;
  const height = 330;
  const plot = { left: 58, top: 28, width: 630, height: 220 };
  const max = Math.max(...chart.values, 1);
  const tickCount = 4;
  const parts = [];
  for (let index = 0; index <= tickCount; index += 1) {
    const value = max * (index / tickCount);
    const y = plot.top + plot.height - (index / tickCount) * plot.height;
    parts.push(`<line class="chart-grid-line" x1="${plot.left}" y1="${y}" x2="${plot.left + plot.width}" y2="${y}"></line>`);
    parts.push(`<text class="chart-axis-label" x="${plot.left - 10}" y="${y + 4}" text-anchor="end">${escapeHtml(formatChartNumber(value))}</text>`);
  }

  const points = chart.values.map((value, index) => {
    const x = plot.left + (chart.values.length === 1 ? plot.width / 2 : (index / (chart.values.length - 1)) * plot.width);
    const y = plot.top + plot.height - (value / max) * plot.height;
    return { x, y };
  });

  if (chart.type === 'bar') {
    const slot = plot.width / chart.values.length;
    const barWidth = Math.min(56, slot * 0.64);
    chart.values.forEach((value, index) => {
      const x = plot.left + slot * index + (slot - barWidth) / 2;
      const y = plot.top + plot.height - (value / max) * plot.height;
      const barHeight = plot.top + plot.height - y;
      parts.push(`<rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${Math.max(barHeight, 1)}" rx="6" fill="${CHART_COLORS[index % CHART_COLORS.length]}"><title>${escapeHtml(chart.labels[index])}: ${escapeHtml(formatChartNumber(value))}</title></rect>`);
      parts.push(`<text class="chart-axis-label chart-x-label" x="${x + barWidth / 2}" y="${plot.top + plot.height + 24}" text-anchor="middle">${escapeHtml(shortChartLabel(chart.labels[index]))}</text>`);
    });
  } else {
    parts.push(`<polyline class="chart-line" points="${points.map(point => `${point.x},${point.y}`).join(' ')}"></polyline>`);
    points.forEach((point, index) => {
      parts.push(`<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="5" fill="${CHART_COLORS[0]}"><title>${escapeHtml(chart.labels[index])}: ${escapeHtml(formatChartNumber(chart.values[index]))}</title></circle>`);
      parts.push(`<text class="chart-axis-label chart-x-label" x="${point.x}" y="${plot.top + plot.height + 24}" text-anchor="middle">${escapeHtml(shortChartLabel(chart.labels[index]))}</text>`);
    });
  }

  return `<svg class="doc-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttribute(chart.title)}">${parts.join('')}</svg>`;
}

function renderCircularChart(chart) {
  const width = 720;
  const height = 300;
  const cx = 360;
  const cy = 150;
  const radius = 108;
  const fractions = getChartFractions(chart.values);
  const max = Math.max(...chart.values, 1);
  let angle = -Math.PI / 2;
  const parts = [];

  chart.values.forEach((value, index) => {
    const sweep = chart.type === 'polar' ? (Math.PI * 2) / chart.values.length : fractions[index] * Math.PI * 2;
    const nextAngle = angle + sweep;
    const outerRadius = chart.type === 'polar' ? Math.max(8, (value / max) * radius) : radius;
    const innerRadius = chart.type === 'doughnut' ? 58 : 0;
    parts.push(`<path class="chart-slice" d="${buildChartArcPath(cx, cy, outerRadius, angle, nextAngle, innerRadius)}" fill="${CHART_COLORS[index % CHART_COLORS.length]}"><title>${escapeHtml(chart.labels[index])}: ${escapeHtml(formatChartNumber(value))}</title></path>`);
    angle = nextAngle;
  });

  return `<svg class="doc-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttribute(chart.title)}">${parts.join('')}</svg>`;
}

function renderRadarChart(chart) {
  const width = 720;
  const height = 330;
  const cx = 360;
  const cy = 160;
  const radius = 112;
  const max = Math.max(...chart.values, 1);
  const angles = chart.labels.map((_, index) => -Math.PI / 2 + (Math.PI * 2 * index) / chart.labels.length);
  const parts = [];
  for (let level = 1; level <= 4; level += 1) {
    const points = angles.map(angle => {
      const point = chartPoint(cx, cy, radius * (level / 4), angle);
      return `${point.x},${point.y}`;
    }).join(' ');
    parts.push(`<polygon class="chart-radar-grid" points="${points}"></polygon>`);
  }
  angles.forEach((angle, index) => {
    const point = chartPoint(cx, cy, radius, angle);
    const labelPoint = chartPoint(cx, cy, radius + 22, angle);
    parts.push(`<line class="chart-radar-axis" x1="${cx}" y1="${cy}" x2="${point.x}" y2="${point.y}"></line>`);
    parts.push(`<text class="chart-axis-label" x="${labelPoint.x}" y="${labelPoint.y + 4}" text-anchor="middle">${escapeHtml(shortChartLabel(chart.labels[index], 18))}</text>`);
  });
  const dataPoints = angles.map((angle, index) => {
    const point = chartPoint(cx, cy, (chart.values[index] / max) * radius, angle);
    return `${point.x},${point.y}`;
  }).join(' ');
  parts.push(`<polygon class="chart-radar-data" points="${dataPoints}"></polygon>`);
  angles.forEach((angle, index) => {
    const point = chartPoint(cx, cy, (chart.values[index] / max) * radius, angle);
    parts.push(`<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="4" fill="${CHART_COLORS[0]}"></circle>`);
  });
  return `<svg class="doc-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttribute(chart.title)}">${parts.join('')}</svg>`;
}

function renderChartMarkup(source) {
  const result = parseChartDefinition(source);
  if (!result.ok) {
    return `<div class="doc-chart chart-error"><strong>Chart tidak dapat dipaparkan</strong><span>${escapeHtml(result.error)}</span></div>`;
  }
  const chart = result.chart;
  const svg = ['bar', 'line'].includes(chart.type)
    ? renderCartesianChart(chart)
    : chart.type === 'radar'
      ? renderRadarChart(chart)
      : renderCircularChart(chart);
  return `<figure class="doc-chart" contenteditable="false" data-chart-type="${escapeAttribute(chart.type)}" data-chart-definition="${escapeAttribute(JSON.stringify(chart))}"><figcaption>${escapeHtml(chart.title)}</figcaption>${svg}${chartLegend(chart)}</figure>`;
}

function hydrateCharts(root) {
  root.querySelectorAll('.doc-chart[data-chart-definition]').forEach((chartElement) => {
    if (chartElement.querySelector('.doc-chart-svg')) return;
    try {
      const chart = JSON.parse(chartElement.dataset.chartDefinition);
      const markup = renderChartMarkup(JSON.stringify(chart));
      chartElement.replaceWith(document.createRange().createContextualFragment(markup));
    } catch {
      chartElement.classList.add('chart-error');
    }
  });
}

function renderMarkdown(text) {
  const normalized = (text || '').replace(/(^|\n)(> \[!([A-Z]+)\][^\n]*(?:\n>.*)*)/gi, (match, prefix, block, label) => {
    const rawType = (label || '').trim().toLowerCase();
    const variant = {
      tip: 'tip',
      info: 'info',
      note: 'note',
      warning: 'warn',
      caution: 'warn',
      important: 'important',
      success: 'success',
      danger: 'danger',
      error: 'danger',
      quote: 'quote'
    }[rawType] || 'info';

    const iconMap = {
      tip: '💡',
      info: 'ℹ️',
      note: '📝',
      warn: '⚠️',
      important: '❗',
      success: '✅',
      danger: '⛔',
      quote: '❝'
    };

    const labelMap = {
      tip: 'Tip',
      info: 'Info',
      note: 'Note',
      warn: 'Warning',
      important: 'Important',
      success: 'Success',
      danger: 'Danger',
      quote: 'Quote'
    };

    const body = block
      .replace(/^>\s*\[![A-Z]+\][^\n]*\n?/i, '')
      .split('\n')
      .map(line => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();

    const html = marked.parse(body || 'Tulis nota di sini…');
    return `${prefix}<div class="callout callout-${variant}"><div class="callout-header"><span class="callout-icon">${iconMap[variant] || 'ℹ️'}</span><span>${labelMap[variant] || 'Info'}</span></div><div class="callout-body">${html}</div></div>`;
  });

  const chartMarkup = [];
  const chartTokenized = normalized.replace(/(^|\n)```chart[ \t]*\n([\s\S]*?)\n```(?=\n|$)/gi, (match, prefix, source) => {
    const token = `DOCBOOK_CHART_TOKEN_${chartMarkup.length}`;
    chartMarkup.push({ token, html: renderChartMarkup(source) });
    return `${prefix}\n${token}\n`;
  });
  let html = sanitizeRenderedHtml(marked.parse(groupConsecutiveMarkdownImages(chartTokenized)));
  chartMarkup.forEach(({ token, html: chartHtml }) => {
    html = html.split(`<p>${token}</p>`).join(chartHtml);
  });

  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('a').forEach((link) => {
    const href = (link.getAttribute('href') || '').trim();
    const label = (link.textContent || '').trim();
    const isLikelyFile = /\.[a-z0-9]{1,8}(?:\?.*)?(?:#.*)?$/i.test(href || '') || /\.[a-z0-9]{1,8}$/i.test(label);
    if (!href || !isLikelyFile || isLikelyImageUrl(href) || link.classList.contains('file-attachment-open') || link.classList.contains('media-item')) return;
    const isPdf = /\.pdf(?:\?.*)?(?:#.*)?$/i.test(href) || /\.pdf$/i.test(label);
    const sizeText = link.getAttribute('title') || '';
    const cardHtml = buildFileAttachmentCard({
      name: label || 'File',
      href,
      size: sizeText
    });
    link.replaceWith(cardHtml);
  });

  return template.innerHTML;
}

function enhanceDocumentPage(pageBody) {
  const toc = document.getElementById('docToc');
  const headings = [...pageBody.querySelectorAll('h2, h3')];
  if (headings.length) {
    toc.innerHTML = `<div class="doc-toc-title">${getText('pageInThisPage') || 'In this page'}</div>`;
    headings.forEach((heading, index) => {
      heading.id = `section-${index}`;
      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      link.className = heading.tagName === 'H3' ? 'toc-h3' : '';
      toc.appendChild(link);
    });
  } else {
    toc.remove();
  }

  initMediaGallery(pageBody);
  initDocumentMaps(pageBody);


function initDocumentMaps(root) {
  root.querySelectorAll('.doc-map[data-map-lat][data-map-lon]').forEach((map) => {
    const latitude = Number(map.dataset.mapLat);
    const longitude = Number(map.dataset.mapLon);
    const iframe = map.querySelector('iframe');
    if (!iframe || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    if (map.querySelector('.doc-map-reset')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'doc-map-reset';
    button.title = getText('returnToLocation');
    button.setAttribute('aria-label', getText('returnToLocation'));
    button.innerHTML = '<i class="fa-solid fa-location-crosshairs" aria-hidden="true"></i>';
    button.addEventListener('click', () => {
      const resetUrl = buildMapEmbedUrl(latitude, longitude);
      iframe.src = `${resetUrl}&reset=${Date.now()}`;
    });
    map.append(button);

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.className = 'doc-map-copy';
    copyButton.title = getText('copyCoordinates');
    copyButton.setAttribute('aria-label', getText('copyCoordinates'));
    copyButton.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i>';
    copyButton.addEventListener('click', async () => {
      const coordinates = `${latitude}, ${longitude}`;
      try {
        await navigator.clipboard.writeText(coordinates);
        copyButton.classList.add('is-copied');
        copyButton.title = getText('coordinatesCopied');
        copyButton.setAttribute('aria-label', getText('coordinatesCopied'));
        copyButton.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
        setTimeout(() => {
          copyButton.classList.remove('is-copied');
          copyButton.title = getText('copyCoordinates');
          copyButton.setAttribute('aria-label', getText('copyCoordinates'));
          copyButton.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i>';
        }, 1400);
      } catch (error) {
        console.warn('Unable to copy map coordinates', error);
      }
    });
    map.append(copyButton);
  });
}
  pageBody.querySelectorAll('.file-attachment-share').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const url = button.dataset.fileUrl;
      const name = button.dataset.fileName || 'File';
      if (!url) return;

      try {
        if (navigator.share) {
          await navigator.share({ title: name, text: name, url });
          return;
        }
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          const status = button.closest('.file-attachment-card')?.querySelector('.file-attachment-size');
          if (status) {
            const original = status.textContent;
            status.textContent = 'Link copied';
            setTimeout(() => { status.textContent = original; }, 1200);
          }
        }
      } catch (error) {
        console.warn('Unable to share file', error);
      }
    });
  });

  pageBody.querySelectorAll('pre').forEach((pre) => {
    const button = document.createElement('button');
    button.className = 'code-copy-btn';
    button.textContent = getText('copy');
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || '');
      button.textContent = getText('copied');
      button.classList.add('copied');
      setTimeout(() => { button.textContent = getText('copy'); button.classList.remove('copied'); }, 1200);
    });
    pre.appendChild(button);
  });

  document.querySelectorAll('[data-page-id], [data-crumb-id]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const id = link.dataset.pageId || link.dataset.crumbId;
      if (!findNode(id)) return;
      state.activeId = id;
      saveState();
      renderTree();
      renderContent();
      contentEl.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function applyEditModeToTitle(node) {
  const titleEl = document.getElementById('pageTitle');
  if (!titleEl) return;
  const editing = document.body.classList.contains('edit-mode');
  titleEl.contentEditable = editing ? 'true' : 'false';
}

function formatLastUpdated(node) {
  const rawTimestamp = typeof node?.updatedAt === 'number'
    ? node.updatedAt
    : Date.parse(node?.updatedAt || '');
  const timestamp = Number.isFinite(rawTimestamp) ? rawTimestamp : Date.now();
  const elapsed = Math.max(0, Date.now() - timestamp);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (elapsed < minute) return getText('lastUpdatedJustNow');
  if (elapsed < hour) {
    return getText('lastUpdatedMinutes').replace('{count}', String(Math.floor(elapsed / minute)));
  }
  if (elapsed < day) {
    return getText('lastUpdatedHours').replace('{count}', String(Math.floor(elapsed / hour)));
  }
  if (elapsed < 365 * day) {
    return getText('lastUpdatedDays').replace('{count}', String(Math.floor(elapsed / day)));
  }

  const date = new Date(timestamp);
  const dateLabel = [date.getDate(), date.getMonth() + 1, date.getFullYear()]
    .map((part) => String(part).padStart(2, '0'))
    .join('/');
  return getText('lastUpdatedDate').replace('{date}', dateLabel);
}

function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeLegacyMediaContent(text) {
  const legacyGalleryPattern = /<div\b[^>]*class=(["'])[^"']*\bmedia-gallery\b[^"']*\1[^>]*>[\s\S]*?<\/div>\s*(?:<button\b[^>]*class=(["'])[^"']*\bmedia-gallery-toggle\b[^"']*\2[^>]*>[\s\S]*?<\/button>)?/gi;

  return String(text || '').replace(legacyGalleryPattern, (block) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = block;
    if (wrapper.querySelector('.media-item img, .media-item video')) return block;
    const snippets = [];

    wrapper.querySelectorAll('.media-item').forEach((item) => {
      const image = item.querySelector('img[src]');
      if (image) {
        const src = image.getAttribute('src') || '';
        if (src) {
          const caption = image.getAttribute('alt') || '';
          snippets.push(`![${safeMarkdownCaption(caption)}](${src})`);
        }
        return;
      }

      const video = item.querySelector('video[src]');
      if (video) {
        const src = video.getAttribute('src') || '';
        if (src) {
          snippets.push(`<video controls preload="metadata" src="${escapeAttribute(src)}"></video>`);
        }
      }
    });

    return snippets.length ? `\n${snippets.join('\n')}\n` : '';
  });
}

function removeEphemeralMediaSources(text) {
  const source = String(text || '');
  const ephemeralImages = parseMarkdownImages(source)
    .filter((image) => /^blob:/i.test(image.src));
  let cleaned = source;

  [...ephemeralImages].reverse().forEach((image) => {
    const lineStart = source.lastIndexOf('\n', image.start - 1) + 1;
    const nextLineBreak = source.indexOf('\n', image.end);
    const lineEnd = nextLineBreak === -1 ? source.length : nextLineBreak;
    const lineContent = source.slice(lineStart, lineEnd).trim();
    const imageContent = source.slice(image.start, image.end).trim();
    const removeStart = lineContent === imageContent ? lineStart : image.start;
    const removeEnd = lineContent === imageContent
      ? (nextLineBreak === -1 ? source.length : nextLineBreak + 1)
      : image.end;
    cleaned = `${cleaned.slice(0, removeStart)}${cleaned.slice(removeEnd)}`;
  });

  return cleaned;
}

function buildMediaGalleryMarkup(items) {
  const hiddenCount = Math.max(0, items.length - 3);
  const columnCount = Math.min(items.length, 3);
  const lastVisibleIndex = columnCount - 1;
  const moreImagesLabel = hiddenCount
    ? getText('moreImages').replace('{count}', String(hiddenCount))
    : '';

  const galleryHtml = `
    <div class="media-gallery media-gallery-${columnCount}" data-gallery-limit="3">
      ${items.map((item, index) => {
        const src = escapeAttribute(item.src);
        const label = escapeAttribute(item.caption || item.title || 'Media');
        const moreOverlay = index === lastVisibleIndex && hiddenCount
          ? `<span class="media-more-overlay">${moreImagesLabel}</span>`
          : '';

        if (item.type === 'video') {
          const captionHtml = item.caption
            ? `<p>${escapeHtml(item.caption)}</p>`
            : '';
          return `
            <a href='${src}' class='media-item' data-media-type='video' data-sub-html='${escapeAttribute(captionHtml)}' aria-label='${label}'>
              <video controls preload='metadata' src='${src}'></video>
              <span class='media-badge'>Video</span>
              ${moreOverlay}
            </a>
          `.replace(/\n\s+/g, ' ');
        }

        const captionHtml = item.caption
          ? `<p>${escapeHtml(item.caption)}</p>`
          : '';
        return `
          <a href='${src}' class='media-item' data-media-type='image' data-sub-html='${escapeAttribute(captionHtml)}' aria-label='${label}'>
            <img src='${src}' alt='${label}' />
            ${moreOverlay}
          </a>
        `.replace(/\n\s+/g, ' ');
      }).join('')}
    </div>
  `;

  return galleryHtml.trim();
}

function groupConsecutiveMarkdownImages(text) {
  const source = String(text || '');
  const images = parseMarkdownImages(source);

  const fencedCodeRanges = [];
  let openFence = null;
  let offset = 0;
  source.split('\n').forEach((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (marker) {
      const token = marker[1];
      if (!openFence) {
        openFence = { character: token[0], length: token.length, start: offset };
      } else if (token[0] === openFence.character && token.length >= openFence.length) {
        fencedCodeRanges.push({ start: openFence.start, end: offset + line.length });
        openFence = null;
      }
    }
    offset += line.length + 1;
  });
  if (openFence) fencedCodeRanges.push({ start: openFence.start, end: source.length });
  const isInsideFencedCode = (position) => fencedCodeRanges.some(
    (range) => position >= range.start && position <= range.end
  );

  const isOwnLine = (image) => {
    if (isInsideFencedCode(image.start)) return false;
    const lineStart = source.lastIndexOf('\n', image.start - 1) + 1;
    const lineBreak = source.indexOf('\n', image.end);
    const lineEnd = lineBreak === -1 ? source.length : lineBreak;
    return !source.slice(lineStart, image.start).trim()
      && !source.slice(image.end, lineEnd).trim();
  };

  const groups = [];
  let current = [];
  images.forEach((image) => {
    const previous = current[current.length - 1];
    const separatedOnlyByWhitespace = previous
      && /^\s*$/.test(source.slice(previous.end, image.start));
    if (isOwnLine(image) && (!previous || separatedOnlyByWhitespace)) {
      current.push(image);
      return;
    }
    if (current.length > 0) groups.push(current);
    current = isOwnLine(image) ? [image] : [];
  });
  if (current.length > 0) groups.push(current);
  if (!groups.length) return source;

  let cursor = 0;
  let output = '';
  groups.forEach((group) => {
    output += source.slice(cursor, group[0].start);
    output += `\n${buildMediaGalleryMarkup(group.map((image) => ({
      type: 'image',
      src: image.src,
      caption: image.caption,
      title: image.title
    })))}\n`;
    cursor = group[group.length - 1].end;
  });
  return output + source.slice(cursor);
}

function initMediaGallery(pageBody) {
  const galleries = pageBody.querySelectorAll('.media-gallery');
  const galleryFn = window.Lightgallery || window.lightGallery;
  if (!galleryFn || !galleries.length) return;

  galleries.forEach((gallery) => {
    const overflowOverlay = gallery.querySelector('.media-more-overlay');
    if (overflowOverlay && !overflowOverlay.closest('.media-item')) {
      const visibleItems = [...gallery.querySelectorAll('.media-item')]
        .filter((item) => getComputedStyle(item).display !== 'none');
      visibleItems.at(-1)?.appendChild(overflowOverlay);
    }
    if (gallery.dataset.lgInitialized === 'true') return;
    gallery.dataset.lgInitialized = 'true';
    try {
      galleryFn(gallery, {
        selector: '.media-item',
        download: false,
        thumbnail: true,
        animateThumb: true,
        showThumbByDefault: true,
        toggleThumb: true,
        zoom: true,
        scale: 1,
        actualSize: true,
        fullScreen: true,
        autoplayVideoOnSlide: false,
        autoplayControls: false,
        share: false,
        mousewheel: true,
        enableDrag: true,
        enableSwipe: true,
        swipeThreshold: 50,
        hideControlOnEnd: false,
        loop: false,
        closable: true,
        getCaptionFromTitleOrAlt: false,
        subHtmlSelectorRelative: true,
        mobileSettings: {
          controls: true,
          showCloseIcon: true,
          download: false
        }
      });
    } catch (error) {
      console.warn('Unable to initialize LightGallery', error);
    }
  });

}

function parseEditorImages(text) {
  const source = text || '';
  const htmlPattern = /<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi;
  const items = parseMarkdownImages(source).map((image) => ({
    ...image,
    id: `image-${image.start}`
  }));

  let match;
  while ((match = htmlPattern.exec(source))) {
    items.push({
      id: `image-${match.index}`,
      start: match.index,
      end: match.index + match[0].length,
      syntax: 'html',
      src: match[2],
      caption: (match[0].match(/\balt=(["'])(.*?)\1/i) || [])[2] || ''
    });
  }

  return items.sort((a, b) => a.start - b.start);
}

function imageCaptionFromFilename(filename) {
  return String(filename || 'Imej').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Imej';
}

function isValidImageSource(source) {
  if (!source) return false;
  try {
    const url = new URL(source, window.location.href);
    return ['http:', 'https:', 'data:', 'blob:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function isLikelyImageUrl(source) {
  try {
    return /\.(?:png|jpe?g|gif|webp|avif)(?:$|[?#])/i.test(new URL(source, window.location.href).pathname);
  } catch {
    return false;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read image'));
    reader.readAsDataURL(file);
  });
}

async function sendImageToImgBB(dataUrl) {
  return fetch('/api/imgbb-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl })
  });
}

async function uploadImageDataUrlToImgBB(dataUrl) {
  const response = await sendImageToImgBB(dataUrl);
  let result = await response.json().catch(() => null);
  if (!response.ok || !result?.url) {
    throw new Error(result?.error || 'ImgBB upload failed');
  }
  return result.url;
}

async function uploadImageToImgBB(file) {
  const dataUrl = await readFileAsDataUrl(file);
  return uploadImageDataUrlToImgBB(dataUrl);
}

function safeMarkdownCaption(value) {
  return String(value || 'Imej')
    .replace(/[\r\n\[\]]/g, '')
    .trim() || 'Imej';
}

function insertTextAtSelection(textarea, value) {
  if (textarea.isContentEditable) {
    insertHtmlAtSelection(textarea, renderMarkdown(value));
    return;
  }
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.setRangeText(value, start, end, 'end');
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function getEditorSelectionRange(textarea) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  return textarea.contains(range.commonAncestorContainer) ? range.cloneRange() : null;
}

function restoreEditorSelection(textarea, range) {
  if (!range) return;
  textarea.focus();
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

function insertHtmlAtSelection(textarea, html) {
  if (!textarea.isContentEditable) return false;
  const selection = window.getSelection();
  const hasEditorSelection = selection?.rangeCount
    && textarea.contains(selection.getRangeAt(0).commonAncestorContainer);
  textarea.focus();
  const range = hasEditorSelection
    ? selection.getRangeAt(0)
    : document.createRange();
  if (!hasEditorSelection) {
    range.selectNodeContents(textarea);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  range.deleteContents();
  const fragment = range.createContextualFragment(html);
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

function applyCalloutToSelection(textarea, variant) {
  if (!textarea.isContentEditable) return false;

  const selection = window.getSelection();
  const hasEditorSelection = selection?.rangeCount
    && textarea.contains(selection.getRangeAt(0).commonAncestorContainer);
  const range = hasEditorSelection ? selection.getRangeAt(0) : document.createRange();
  if (!hasEditorSelection) {
    range.selectNodeContents(textarea);
    range.collapse(false);
  }
  const selectedTrailingParagraph = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
    ? range.commonAncestorContainer.parentElement?.closest('.editor-trailing-paragraph')
    : range.commonAncestorContainer.closest?.('.editor-trailing-paragraph');
  const isEmptyTrailingParagraph = selectedTrailingParagraph
    && !selectedTrailingParagraph.textContent.trim();
  if (isEmptyTrailingParagraph) range.selectNode(selectedTrailingParagraph);

  const body = document.createElement('div');
  body.className = 'callout-body';
  const selectedContent = isEmptyTrailingParagraph ? null : range.cloneContents();
  if (selectedContent && (selectedContent.textContent.trim() || selectedContent.childNodes.length)) {
    body.append(selectedContent);
  } else {
    body.innerHTML = '<p>Tulis kandungan di sini...</p>';
  }

  const iconMap = {
    tip: '💡', info: 'ℹ️', note: '📝', warn: '⚠️',
    important: '❗', success: '✅', danger: '⛔', quote: '❝'
  };
  const labelMap = {
    tip: getText('tip'), info: getText('info'), note: getText('note'),
    warn: getText('warning'), important: getText('important'),
    success: getText('success'), danger: getText('danger'), quote: getText('quote')
  };
  const callout = document.createElement('div');
  callout.className = `callout callout-${variant}`;
  callout.innerHTML = `<div class="callout-header"><span class="callout-icon">${iconMap[variant] || iconMap.info}</span><span>${labelMap[variant] || labelMap.info}</span></div>`;
  callout.append(body);

  range.deleteContents();
  range.insertNode(callout);
  range.setStartAfter(callout);
  range.collapse(true);
  if (isEmptyTrailingParagraph) {
    const trailingParagraph = document.createElement('p');
    trailingParagraph.className = 'editor-trailing-paragraph';
    trailingParagraph.innerHTML = '<br>';
    callout.after(trailingParagraph);
  }
  selection?.removeAllRanges();
  selection?.addRange(range);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

function ensureEditorTrailingParagraph(textarea) {
  const lastElement = textarea.lastElementChild;
  if (lastElement?.classList.contains('editor-trailing-paragraph')) return lastElement;

  const paragraph = document.createElement('p');
  paragraph.className = 'editor-trailing-paragraph';
  paragraph.innerHTML = '<br>';
  textarea.append(paragraph);
  return paragraph;
}

function buildEditorTableMarkup(rowCount, columnCount) {
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const cells = Array.from({ length: columnCount }, (_, columnIndex) => {
      const tag = rowIndex === 0 ? 'th' : 'td';
      const label = rowIndex === 0 ? `Tajuk ${columnIndex + 1}` : 'Isi kandungan';
      return `<${tag}>${label}</${tag}>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<div class="editor-table-wrap"><table><thead>${rows.split('</tr>')[0]}</tr></thead><tbody>${rows.split('</tr>').slice(1).filter(Boolean).map(row => `${row}</tr>`).join('')}</tbody></table></div>`;
}

function insertTableAtSelection(textarea) {
  const rowCount = Number.parseInt(window.prompt('Bilangan baris (2-12)', '3'), 10);
  const columnCount = Number.parseInt(window.prompt('Bilangan lajur (2-8)', '3'), 10);
  if (!Number.isInteger(rowCount) || !Number.isInteger(columnCount)
    || rowCount < 2 || rowCount > 12 || columnCount < 2 || columnCount > 8) return;

  const selection = window.getSelection();
  const hasEditorSelection = selection?.rangeCount
    && textarea.contains(selection.getRangeAt(0).commonAncestorContainer);
  const range = hasEditorSelection ? selection.getRangeAt(0) : document.createRange();
  if (!hasEditorSelection) {
    range.selectNodeContents(textarea);
    range.collapse(false);
  }
  const container = range.commonAncestorContainer;
  const trailingParagraph = (container.nodeType === Node.TEXT_NODE
    ? container.parentElement
    : container).closest?.('.editor-trailing-paragraph');
  const isEmptyTrailingParagraph = trailingParagraph && !trailingParagraph.textContent.trim();
  if (isEmptyTrailingParagraph) range.selectNode(trailingParagraph);

  range.deleteContents();
  const fragment = range.createContextualFragment(buildEditorTableMarkup(rowCount, columnCount));
  const tableWrap = fragment.firstElementChild;
  range.insertNode(fragment);
  const afterTable = document.createElement('p');
  afterTable.className = 'editor-trailing-paragraph';
  afterTable.innerHTML = '<br>';
  tableWrap.after(afterTable);
  range.setStart(afterTable, 0);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function getSelectedEditorTable(textarea) {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return null;
  const container = selection.getRangeAt(0).commonAncestorContainer;
  const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
  const table = element.closest?.('table');
  return table && textarea.contains(table) ? table : null;
}

function addTableRow(textarea) {
  const table = getSelectedEditorTable(textarea);
  if (!table) return;
  const columnCount = table.rows[0]?.cells.length || 0;
  if (!columnCount || table.rows.length >= 30) return;
  const row = table.insertRow(-1);
  for (let index = 0; index < columnCount; index += 1) {
    row.insertCell().textContent = 'Isi kandungan';
  }
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function addTableColumn(textarea) {
  const table = getSelectedEditorTable(textarea);
  if (!table || table.rows[0]?.cells.length >= 15) return;
  [...table.rows].forEach((row, rowIndex) => {
    const cell = row.insertCell(-1);
    cell.textContent = rowIndex === 0 ? `Tajuk ${row.cells.length}` : 'Isi kandungan';
    if (rowIndex === 0) cell.outerHTML = cell.outerHTML.replace('<td', '<th').replace('</td>', '</th>');
  });
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function deleteSelectedTable(textarea) {
  const table = getSelectedEditorTable(textarea);
  if (!table) return;
  const tableWrap = table.closest('.editor-table-wrap') || table;
  const nextParagraph = tableWrap.nextElementSibling;
  tableWrap.remove();
  if (!nextParagraph?.classList.contains('editor-trailing-paragraph')) {
    ensureEditorTrailingParagraph(textarea);
  }
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function appendImageToGallery(textarea, gallery, caption, src) {
  if (!gallery?.isConnected) return false;
  const item = document.createRange().createContextualFragment(buildMediaGalleryMarkup([{
    type: 'image',
    src,
    caption: safeMarkdownCaption(caption)
  }])).firstElementChild?.firstElementChild;
  if (!item) return false;
  gallery.append(item);
  gallery.className = [...gallery.classList]
    .filter((name) => !/^media-gallery-\d+$/.test(name))
    .concat(`media-gallery-${Math.min(gallery.querySelectorAll('.media-item').length, 3)}`)
    .join(' ');
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

function insertImageAtSelection(textarea, caption, src) {
  const safeCaption = safeMarkdownCaption(caption);
  const markdown = `\n![${safeCaption}](${src})\n`;
  const markup = buildMediaGalleryMarkup([{ type: 'image', src, caption: safeCaption }]);
  if (!insertHtmlAtSelection(textarea, markup)) insertTextAtSelection(textarea, markdown);
}

function replaceEditorImage(textarea, media, src, caption) {
  const safeCaption = safeMarkdownCaption(caption);
  if (textarea.isContentEditable) {
    const image = [...textarea.querySelectorAll('img')].find((candidate) => (
      candidate.getAttribute('src') === media.src
      && (!media.caption || candidate.getAttribute('alt') === media.caption)
    ));
    if (!image) return;
    image.setAttribute('src', src);
    image.setAttribute('alt', safeCaption);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
    return;
  }
  const replacement = media.syntax === 'html'
    ? `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(safeCaption)}">`
    : serializeMarkdownImage({ caption: safeCaption, src, title: media.title });
  textarea.setRangeText(replacement, media.start, media.end, 'end');
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function removeEditorImage(textarea, media) {
  if (textarea.isContentEditable) {
    const image = [...textarea.querySelectorAll('img')].find((candidate) => (
      candidate.getAttribute('src') === media.src
      && (!media.caption || candidate.getAttribute('alt') === media.caption)
    ));
    image?.closest('.media-item')?.remove() || image?.remove();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
    return;
  }
  textarea.setRangeText('', media.start, media.end, 'end');
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

function promoteImageToGallery(image) {
  if (!image?.isConnected || image.closest('.media-gallery')) return image?.closest('.media-gallery') || null;
  const gallery = document.createElement('div');
  gallery.className = 'media-gallery media-gallery-1';
  const item = document.createElement('a');
  item.className = 'media-item';
  item.href = image.getAttribute('src') || '';
  item.dataset.mediaType = 'image';
  item.setAttribute('aria-label', image.getAttribute('alt') || 'Media');
  image.replaceWith(gallery);
  item.append(image);
  gallery.append(item);
  return gallery;
}

function setMediaStatus(message, isError = false) {
  const status = document.getElementById('mediaStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

async function handleMediaUpload(files, textarea, captionOverride = '', targetGallery = null) {
  const selectedFiles = [...(files || [])];
  const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
  if (!imageFiles.length) {
    setMediaStatus(getText('invalidImageFile'), true);
    return false;
  }

  try {
    if (imageFiles.length) setMediaStatus(getText('uploadingImage'));
    const imageItems = [];
    for (const file of imageFiles) {
      const src = await uploadImageToImgBB(file);
      const caption = captionOverride || imageCaptionFromFilename(file.name);
      imageItems.push({ type: 'image', src, caption: safeMarkdownCaption(caption) });
    }
    const markdown = imageItems.map((item) => `![${item.caption}](${item.src})`).join('\n');
    if (targetGallery?.isConnected) {
      imageItems.forEach((item) => appendImageToGallery(textarea, targetGallery, item.caption, item.src));
    } else if (!insertHtmlAtSelection(textarea, buildMediaGalleryMarkup(imageItems))) {
      insertTextAtSelection(textarea, `\n${markdown}\n`);
    }
    setMediaStatus(getText('imageReady'));
    return true;
  } catch (error) {
    console.warn('Unable to upload image to ImgBB', error);
    setMediaStatus(error.message || getText('invalidImageFile'), true);
    return false;
  }
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function handleFileUpload(files, textarea, nameOverride = '') {
  const selectedFiles = [...(files || [])];
  if (!selectedFiles.length) {
    setMediaStatus(getText('invalidFile'), true);
    return false;
  }

  try {
    const snippets = [];
    for (const file of selectedFiles) {
      const dataUrl = await readFileAsDataUrl(file);
      const title = (nameOverride || file.name || 'File').trim() || 'File';
      const href = dataUrl;
      const safeName = sanitizeFileName(title);
      snippets.push(serializeFileLink({
        name: safeName,
        href,
        size: formatFileSize(file.size)
      }));
    }
    insertTextAtSelection(textarea, `\n${snippets.join('\n')}\n`);
    setMediaStatus(getText('fileLinkReady'));
    return true;
  } catch (error) {
    console.warn('Unable to read attached file', error);
    setMediaStatus(error.message || getText('invalidFile'), true);
    return false;
  }
}

function openFileUploadModal(textarea) {
  const existing = document.querySelector('.media-upload-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop media-upload-backdrop';
  backdrop.innerHTML = `
    <div class="modal media-upload-modal" role="dialog" aria-modal="true" aria-labelledby="fileUploadTitle">
      <div class="media-edit-heading">
        <div>
          <p class="media-edit-eyebrow">${getText('mediaManager')}</p>
          <h3 id="fileUploadTitle">${getText('fileUploadTitle')}</h3>
        </div>
        <button type="button" class="icon-btn media-upload-close" aria-label="${getText('close')}">×</button>
      </div>
      <p class="media-upload-hint">${getText('fileUploadHint')}</p>
      <div class="media-upload-file-row">
        <button type="button" class="btn btn-ghost" id="chooseFileUpload">📁 ${getText('selectFile')}</button>
        <span class="media-file-status" id="fileUploadStatus">${getText('noFileSelected')}</span>
        <input type="file" id="fileUploadInput" hidden>
      </div>
      <label class="media-field-label" for="fileUploadUrl">${getText('fileUrl')}</label>
      <input id="fileUploadUrl" type="url" placeholder="https://example.com/file.pdf">
      <label class="media-field-label" for="fileUploadName">${getText('fileName')}</label>
      <input id="fileUploadName" type="text" placeholder="Report.pdf">
      <p class="media-status" id="mediaStatus" aria-live="polite"></p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="fileUploadCancel">${getText('cancel')}</button>
        <button type="button" class="btn btn-primary" id="fileUploadSubmit">📎 ${getText('insertFile')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const fileInput = backdrop.querySelector('#fileUploadInput');
  const chooseButton = backdrop.querySelector('#chooseFileUpload');
  const status = backdrop.querySelector('#mediaStatus');
  const fileStatus = backdrop.querySelector('#fileUploadStatus');
  const urlInput = backdrop.querySelector('#fileUploadUrl');
  const nameInput = backdrop.querySelector('#fileUploadName');
  const submitButton = backdrop.querySelector('#fileUploadSubmit');
  let selectedFile = null;

  const close = () => backdrop.remove();
  backdrop.querySelector('.media-upload-close').addEventListener('click', close);
  backdrop.querySelector('#fileUploadCancel').addEventListener('click', close);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });

  chooseButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0] || null;
    selectedFile = file;
    urlInput.value = '';
    fileStatus.textContent = file ? `${getText('fileSelected')}: ${file.name}` : getText('noFileSelected');
    if (!nameInput.value.trim() && file?.name) {
      nameInput.value = file.name;
    }
  });

  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim()) {
      selectedFile = null;
      fileInput.value = '';
      fileStatus.textContent = getText('noFileSelected');
    }
  });

  submitButton.addEventListener('click', async () => {
    const fileUrl = urlInput.value.trim();
    const fileName = (nameInput.value || selectedFile?.name || 'File').trim() || 'File';
    if (!selectedFile && !fileUrl) {
      status.textContent = getText('invalidFile');
      status.classList.add('is-error');
      return;
    }

    submitButton.disabled = true;
    chooseButton.disabled = true;

    try {
      if (selectedFile) {
        const uploaded = selectedFile.type.startsWith('image/')
          ? await handleMediaUpload([selectedFile], textarea, fileName)
          : await handleFileUpload([selectedFile], textarea, fileName);
        if (uploaded) {
          close();
          return;
        }
      } else {
        const candidateUrl = new URL(fileUrl, window.location.href).toString();
        if (isLikelyImageUrl(candidateUrl)) {
          insertImageAtSelection(textarea, fileName, candidateUrl);
          setMediaStatus(getText('imageReady'));
        } else {
          const link = serializeFileLink({
            name: sanitizeFileName(fileName),
            href: candidateUrl,
            size: ''
          });
          insertTextAtSelection(textarea, `\n${link}\n`);
          setMediaStatus(getText('fileLinkReady'));
        }
        close();
        return;
      }
    } catch (error) {
      status.textContent = error.message || getText('invalidFile');
      status.classList.add('is-error');
    }

    submitButton.disabled = false;
    chooseButton.disabled = false;
  });

  nameInput.focus();
}

function openMediaUploadModal(textarea, targetGallery = null) {
  const existing = document.querySelector('.media-upload-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop media-upload-backdrop';
  backdrop.innerHTML = `
    <div class="modal media-upload-modal" role="dialog" aria-modal="true" aria-labelledby="mediaUploadTitle">
      <div class="media-edit-heading">
        <div>
          <p class="media-edit-eyebrow">${getText('mediaManager')}</p>
          <h3 id="mediaUploadTitle">${getText('uploadMediaTitle')}</h3>
        </div>
        <button type="button" class="icon-btn media-upload-close" aria-label="${getText('close')}">×</button>
      </div>
      <p class="media-upload-hint">${getText('uploadMediaHint')}</p>
      <section id="mediaUploadPane" class="media-modal-pane" role="tabpanel" aria-labelledby="mediaUploadTitle">
        <div class="media-upload-preview" id="mediaUploadPreview" hidden></div>
        <div class="media-upload-file-row">
          <button type="button" class="btn btn-ghost" id="chooseMediaUploadFile">📁 ${getText('selectFile')}</button>
          <span class="media-file-status" id="mediaUploadFileStatus">${getText('noFileSelected')}</span>
          <input type="file" id="mediaUploadFileInput" accept="image/*" hidden>
        </div>
        <div class="media-upload-or"><span>${getText('or')}</span></div>
        <label class="media-field-label" for="mediaUploadUrl">${getText('imageUrl')}</label>
        <input id="mediaUploadUrl" type="url" placeholder="${escapeAttribute(getText('imageUrlPlaceholder'))}">
        <label class="media-field-label" for="mediaUploadCaption">${getText('imageName')}</label>
        <input id="mediaUploadCaption" type="text" placeholder="${escapeAttribute(getText('imageNamePlaceholder'))}">
        <p class="media-status" id="mediaStatus" aria-live="polite"></p>
      </section>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="mediaUploadCancel">${getText('cancel')}</button>
        <button type="button" class="btn btn-primary" id="mediaUploadSubmit">📤 ${getText('upload')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const fileInput = backdrop.querySelector('#mediaUploadFileInput');
  const chooseButton = backdrop.querySelector('#chooseMediaUploadFile');
  const fileStatus = backdrop.querySelector('#mediaUploadFileStatus');
  const preview = backdrop.querySelector('#mediaUploadPreview');
  const captionInput = backdrop.querySelector('#mediaUploadCaption');
  const urlInput = backdrop.querySelector('#mediaUploadUrl');
  const status = backdrop.querySelector('#mediaStatus');
  const submitButton = backdrop.querySelector('#mediaUploadSubmit');
  let selectedFile = null;
  let previewUrl = '';

  const close = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    backdrop.remove();
  };
  backdrop.querySelector('.media-upload-close').addEventListener('click', close);
  backdrop.querySelector('#mediaUploadCancel').addEventListener('click', close);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  chooseButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    selectedFile = fileInput.files[0] || null;
    urlInput.value = '';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    preview.innerHTML = '';
    preview.hidden = true;
    status.textContent = '';
    if (!selectedFile) {
      fileStatus.textContent = getText('noFileSelected');
      return;
    }

    fileStatus.textContent = `${getText('fileSelected')}: ${selectedFile.name}`;
    previewUrl = URL.createObjectURL(selectedFile);
    if (selectedFile.type.startsWith('image/')) {
      preview.innerHTML = `<img src="${escapeAttribute(previewUrl)}" alt="${escapeAttribute(selectedFile.name)}">`;
    }
    preview.hidden = false;
    if (!captionInput.value.trim() && selectedFile.type.startsWith('image/')) {
      captionInput.value = imageCaptionFromFilename(selectedFile.name);
    }
  });
  urlInput.addEventListener('input', () => {
    if (!urlInput.value.trim()) return;
    selectedFile = null;
    fileInput.value = '';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    preview.innerHTML = '';
    preview.hidden = true;
    fileStatus.textContent = getText('noFileSelected');
  });
  submitButton.addEventListener('click', async () => {
    const imageUrl = urlInput.value.trim();
    if (!selectedFile && !imageUrl) {
      status.textContent = getText('noMediaSelected');
      return;
    }
    submitButton.disabled = true;
    chooseButton.disabled = true;
    if (imageUrl) {
      if (!isValidImageSource(imageUrl)) {
        status.textContent = getText('invalidImageUrl');
        submitButton.disabled = false;
        chooseButton.disabled = false;
        return;
      }
      const caption = captionInput.value.trim() || getText('defaultImageCaption');
      if (!appendImageToGallery(textarea, targetGallery, caption, imageUrl)) {
        insertImageAtSelection(textarea, caption, imageUrl);
      }
      close();
      return;
    }
    status.textContent = getText('uploadingImage');
    const uploaded = await handleMediaUpload([selectedFile], textarea, captionInput.value.trim(), targetGallery);
    if (uploaded) {
      close();
      return;
    }
    status.textContent = document.getElementById('mediaStatus')?.textContent || getText('invalidImageFile');
    submitButton.disabled = false;
    chooseButton.disabled = false;
  });

  captionInput.focus();
}

function renderInlineEditorMediaControls(textarea) {
  textarea.querySelectorAll('.editor-media-controls').forEach((controls) => controls.remove());
  const mediaGroups = [
    ...textarea.querySelectorAll('.media-gallery'),
    ...[...textarea.children].filter((element) => element.tagName === 'IMG')
  ];
  const rows = [];

  mediaGroups.forEach((mediaElement) => {
    mediaElement.classList.add('editor-media-hidden');
    const images = mediaElement.matches('.media-gallery')
      ? [...mediaElement.querySelectorAll('.media-item img')]
      : [mediaElement];
    images.forEach((image) => rows.push({ mediaElement, image }));
  });

  rows.forEach(({ mediaElement, image }) => {
    const src = image?.getAttribute('src') || '';
    if (!src) return;
    const media = {
      id: `editor-image-${src}`,
      src,
      caption: image.getAttribute('alt') || '',
      syntax: 'html'
    };
    const controls = document.createElement('div');
    controls.className = 'editor-media-controls';
    controls.contentEditable = 'false';
    controls.innerHTML = `
      <img class="editor-media-thumb" src="${escapeAttribute(src)}" alt="${escapeAttribute(media.caption || getText('imageName'))}">
      <span class="editor-media-name">${escapeHtml(media.caption || getText('imageName'))}</span>
      <button type="button" class="btn btn-ghost editor-media-edit">${getText('editImage')}</button>
      <button type="button" class="btn btn-ghost editor-media-add">${getText('addImage')}</button>
      <button type="button" class="btn btn-danger editor-media-delete">${getText('deleteImage')}</button>
    `;
    controls.querySelector('.editor-media-edit').addEventListener('click', () => openMediaEditDialog(textarea, media));
    controls.querySelector('.editor-media-add').addEventListener('click', () => {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNode(controls);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const targetGallery = mediaElement.matches('.media-gallery')
        ? mediaElement
        : promoteImageToGallery(mediaElement);
      openMediaUploadModal(textarea, targetGallery);
    });
    controls.querySelector('.editor-media-delete').addEventListener('click', () => {
      confirmModal(getText('confirmDeleteImage'), () => removeEditorImage(textarea, media));
    });
    const previousControls = [...textarea.querySelectorAll('.editor-media-controls')].at(-1);
    (previousControls || mediaElement).after(controls);
  });
}

function openMediaEditDialog(textarea, media) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop media-edit-backdrop';
  backdrop.innerHTML = `
    <div class="modal media-edit-modal" role="dialog" aria-modal="true" aria-labelledby="mediaEditTitle">
      <div class="media-edit-heading">
        <div>
          <p class="media-edit-eyebrow">${getText('mediaManager')}</p>
          <h3 id="mediaEditTitle">${getText('editImage')}</h3>
        </div>
        <button type="button" class="icon-btn media-edit-close" aria-label="${getText('close')}">×</button>
      </div>
      <img class="media-edit-preview" src="${escapeAttribute(media.src)}" alt="${escapeAttribute(media.caption || getText('imageName'))}">
      <label class="media-field-label" for="mediaCaptionInput">${getText('addCaption')}</label>
      <input id="mediaCaptionInput" type="text" value="${escapeAttribute(media.caption)}" placeholder="${escapeAttribute(getText('imageNamePlaceholder'))}">
      <label class="media-field-label" for="mediaReplacementInput">${getText('replaceImage')}</label>
      <input id="mediaReplacementInput" type="url" value="" placeholder="${escapeAttribute(getText('replacementUrl'))}">
      <div class="media-replace-actions">
        <button type="button" class="btn btn-ghost" id="chooseReplacementFile">📁 ${getText('chooseImage')}</button>
        <span class="media-file-status" id="mediaFileStatus"></span>
        <input type="file" id="replacementFileInput" accept="image/*" hidden>
      </div>
      <p class="media-edit-status" id="mediaEditStatus"></p>
      <div class="modal-actions media-edit-actions">
        <button type="button" class="btn btn-danger" id="deleteMediaButton">${getText('deleteImage')}</button>
        <div>
          <button type="button" class="btn btn-ghost" id="mediaEditCancel">${getText('cancel')}</button>
          <button type="button" class="btn btn-primary" id="mediaEditSave">${getText('save')}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  const captionInput = backdrop.querySelector('#mediaCaptionInput');
  const replacementInput = backdrop.querySelector('#mediaReplacementInput');
  const fileInput = backdrop.querySelector('#replacementFileInput');
  const preview = backdrop.querySelector('.media-edit-preview');
  const editStatus = backdrop.querySelector('#mediaEditStatus');
  const chooseFileButton = backdrop.querySelector('#chooseReplacementFile');
  const saveButton = backdrop.querySelector('#mediaEditSave');
  let replacementSource = '';
  let replacementError = false;

  backdrop.querySelector('.media-edit-close').addEventListener('click', close);
  backdrop.querySelector('#mediaEditCancel').addEventListener('click', close);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  replacementInput.addEventListener('input', () => {
    replacementSource = '';
    replacementError = false;
    preview.src = replacementInput.value.trim() || media.src;
    editStatus.textContent = '';
  });
  chooseFileButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      editStatus.textContent = getText('invalidImageFile');
      return;
    }
    try {
      replacementError = false;
      chooseFileButton.disabled = true;
      saveButton.disabled = true;
      editStatus.textContent = getText('uploadingImage');
      const localPreview = await readFileAsDataUrl(file);
      preview.src = localPreview;
      replacementSource = await uploadImageDataUrlToImgBB(localPreview);
      replacementInput.value = '';
      backdrop.querySelector('#mediaFileStatus').textContent = `${getText('fileSelected')}: ${file.name}`;
      editStatus.textContent = '';
    } catch (error) {
      console.warn('Unable to upload replacement image to ImgBB', error);
      replacementSource = '';
      replacementError = true;
      editStatus.textContent = error.message || getText('invalidImageFile');
    } finally {
      chooseFileButton.disabled = false;
      saveButton.disabled = false;
    }
  });

  saveButton.addEventListener('click', () => {
    if (replacementError) return;
    const nextSource = replacementSource || replacementInput.value.trim() || media.src;
    if (!isValidImageSource(nextSource)) {
      editStatus.textContent = getText('invalidImageUrl');
      return;
    }
    replaceEditorImage(textarea, media, nextSource, captionInput.value);
    setMediaStatus(getText('imageUpdated'));
    close();
  });

  backdrop.querySelector('#deleteMediaButton').addEventListener('click', () => {
    confirmModal(getText('confirmDeleteImage'), () => {
      removeEditorImage(textarea, media);
      setMediaStatus(getText('imageDeleted'));
      close();
    });
  });

  captionInput.focus();
  captionInput.select();
}

function openChartBuilderModal(textarea, existingChart = null, targetElement = null) {
  document.querySelector('.chart-builder-backdrop')?.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop chart-builder-backdrop';
  backdrop.innerHTML = `
    <div class="modal chart-builder-modal" role="dialog" aria-modal="true" aria-labelledby="chartBuilderTitle">
      <div class="media-edit-heading">
        <div>
          <p class="media-edit-eyebrow">${getText('chart')}</p>
          <h3 id="chartBuilderTitle">${getText('insertChart')}</h3>
        </div>
        <button type="button" class="icon-btn chart-builder-close" aria-label="${getText('close')}">×</button>
      </div>
      <p class="chart-builder-hint">${getText('chartBuilderHint')}</p>
      <div class="chart-builder-fields">
        <div class="chart-builder-field">
          <label for="chartTitleInput">${getText('chartTitle')}</label>
          <input id="chartTitleInput" type="text" maxlength="120" value="${escapeAttribute(existingChart?.title || 'Chart')}">
        </div>
        <div class="chart-builder-field">
          <label for="chartTypeInput">${getText('chartType')}</label>
          <select id="chartTypeInput">
            <option value="bar" ${existingChart?.type === 'bar' ? 'selected' : ''}>${getText('chartBar')}</option>
            <option value="line" ${existingChart?.type === 'line' ? 'selected' : ''}>${getText('chartLine')}</option>
            <option value="pie" ${existingChart?.type === 'pie' ? 'selected' : ''}>${getText('chartPie')}</option>
            <option value="doughnut" ${existingChart?.type === 'doughnut' ? 'selected' : ''}>${getText('chartDoughnut')}</option>
            <option value="polar" ${existingChart?.type === 'polar' ? 'selected' : ''}>${getText('chartPolar')}</option>
            <option value="radar" ${existingChart?.type === 'radar' ? 'selected' : ''}>${getText('chartRadar')}</option>
          </select>
        </div>
      </div>
      <div class="chart-builder-data-heading">
        <div>
          <span class="media-edit-eyebrow">${getText('chartData')}</span>
          <span class="chart-builder-data-copy">${getText('chartLabel')} / ${getText('chartValue')}</span>
        </div>
        <button type="button" class="btn btn-ghost chart-add-row" id="chartAddRow">+ ${getText('addData')}</button>
      </div>
      <div class="chart-data-table">
        <div class="chart-data-header">
          <span>${getText('chartLabel')}</span>
          <span>${getText('chartValue')}</span>
          <span aria-hidden="true"></span>
        </div>
        <div id="chartDataRows"></div>
      </div>
      <div class="chart-builder-preview-heading">${getText('chartPreview')}</div>
      <div id="chartBuilderPreview" class="chart-builder-preview"></div>
      <p id="chartBuilderStatus" class="chart-builder-status" aria-live="polite"></p>
      <div class="modal-actions chart-builder-actions">
        ${targetElement ? `<button type="button" class="btn btn-danger" id="chartBuilderDelete">${getText('delete')}</button>` : ''}
        <button type="button" class="btn btn-ghost" id="chartBuilderCancel">${getText('cancel')}</button>
        <button type="button" class="btn btn-primary" id="chartBuilderInsert">📊 ${getText('insertChart')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const titleInput = backdrop.querySelector('#chartTitleInput');
  const typeInput = backdrop.querySelector('#chartTypeInput');
  const rowsContainer = backdrop.querySelector('#chartDataRows');
  const addRowButton = backdrop.querySelector('#chartAddRow');
  const preview = backdrop.querySelector('#chartBuilderPreview');
  const status = backdrop.querySelector('#chartBuilderStatus');
  const insertButton = backdrop.querySelector('#chartBuilderInsert');
  let rows = existingChart?.labels?.map((label, index) => ({
    label,
    value: String(existingChart.values[index])
  })) || [
    { label: 'Kategori A', value: '40' },
    { label: 'Kategori B', value: '30' },
    { label: 'Kategori C', value: '20' }
  ];

  const handleEscape = event => {
    if (event.key === 'Escape') close();
  };
  const close = () => {
    document.removeEventListener('keydown', handleEscape);
    backdrop.remove();
  };
  backdrop.querySelector('.chart-builder-close').addEventListener('click', close);
  backdrop.querySelector('#chartBuilderCancel').addEventListener('click', close);
  backdrop.querySelector('#chartBuilderDelete')?.addEventListener('click', () => {
    confirmModal(getText('confirmDeleteChart'), () => {
      if (!targetElement?.isConnected) return;
      targetElement.remove();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      close();
    });
  });
  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) close();
  });
  document.addEventListener('keydown', handleEscape);

  const getDefinition = () => {
    const labels = [...rowsContainer.querySelectorAll('.chart-label-input')].map(input => input.value.trim());
    const rawValues = [...rowsContainer.querySelectorAll('.chart-value-input')].map(input => input.value.trim());
    if (labels.some(label => !label) || rawValues.some(value => !value)) {
      return { ok: false, error: getText('chartNeedData') };
    }
    return normalizeChartDefinition({
      title: titleInput.value.trim(),
      type: typeInput.value,
      labels,
      values: rawValues
    });
  };

  const updatePreview = () => {
    const result = getDefinition();
    insertButton.disabled = !result.ok;
    if (!result.ok) {
      preview.innerHTML = `<div class="chart-builder-empty">${escapeHtml(result.error)}</div>`;
      status.textContent = result.error;
      status.classList.add('is-error');
      return;
    }
    preview.innerHTML = renderChartMarkup(JSON.stringify(result.chart));
    status.textContent = '';
    status.classList.remove('is-error');
  };

  const syncRowsFromInputs = () => {
    const labels = [...rowsContainer.querySelectorAll('.chart-label-input')];
    const values = [...rowsContainer.querySelectorAll('.chart-value-input')];
    if (labels.length !== rows.length || values.length !== rows.length) return;
    rows = rows.map((row, index) => ({
      label: labels[index].value,
      value: values[index].value
    }));
  };

  const renderRows = () => {
    rowsContainer.innerHTML = rows.map((row, index) => `
      <div class="chart-data-row">
        <input class="chart-label-input" type="text" value="${escapeAttribute(row.label)}" placeholder="${escapeAttribute(getText('chartLabel'))}" aria-label="${escapeAttribute(getText('chartLabel'))} ${index + 1}">
        <input class="chart-value-input" type="number" min="0" step="any" value="${escapeAttribute(row.value)}" placeholder="0" aria-label="${escapeAttribute(getText('chartValue'))} ${index + 1}">
        <button type="button" class="icon-btn chart-remove-row" aria-label="${escapeAttribute(getText('removeData'))}" ${rows.length <= 2 ? 'disabled' : ''}>×</button>
      </div>
    `).join('');

    rowsContainer.querySelectorAll('.chart-label-input, .chart-value-input').forEach(input => {
      input.addEventListener('input', updatePreview);
    });
    rowsContainer.querySelectorAll('.chart-remove-row').forEach((button, index) => {
      button.addEventListener('click', () => {
        if (rows.length <= 2) return;
        syncRowsFromInputs();
        rows.splice(index, 1);
        renderRows();
      });
    });
    updatePreview();
  };

  titleInput.addEventListener('input', updatePreview);
  typeInput.addEventListener('change', updatePreview);
  addRowButton.addEventListener('click', () => {
    if (rows.length >= 12) return;
    syncRowsFromInputs();
    rows.push({ label: `Kategori ${String.fromCharCode(65 + rows.length)}`, value: '10' });
    renderRows();
    rowsContainer.lastElementChild?.querySelector('.chart-label-input')?.focus();
  });
  insertButton.addEventListener('click', () => {
    const result = getDefinition();
    if (!result.ok) return;
    if (targetElement?.isConnected) {
      targetElement.replaceWith(document.createRange().createContextualFragment(renderChartMarkup(JSON.stringify(result.chart))));
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      close();
      return;
    }
    insertTextAtSelection(textarea, `\n${serializeChartBlock(result.chart)}\n`);
    close();
  });

  renderRows();
  titleInput.focus();
  titleInput.select();
}

function openMapBuilderModal(textarea, existingMap = null, targetElement = null) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const existingLabel = existingMap?.querySelector('.doc-map-heading strong')?.textContent?.trim() || '';
  const existingLink = existingMap?.dataset.mapLink || '';
  backdrop.innerHTML = `
    <div class="modal map-builder-modal" role="dialog" aria-modal="true" aria-labelledby="mapBuilderTitle">
      <h3 id="mapBuilderTitle">${getText('mapBuilderTitle')}</h3>
      <label class="map-builder-field"><span>${getText('mapLabel')}</span><input id="mapLabelInput" type="text" value="${escapeAttribute(existingLabel)}" placeholder="Contoh: Kedai / pejabat"></label>
      <div class="map-builder-coordinate-grid">
        <label class="map-builder-field"><span>${getText('mapLatitude')}</span><input id="mapLatitudeInput" type="number" step="any" min="-90" max="90" value="${escapeAttribute(existingMap?.dataset.mapLat || '')}" placeholder="3.1390"></label>
        <label class="map-builder-field"><span>${getText('mapLongitude')}</span><input id="mapLongitudeInput" type="number" step="any" min="-180" max="180" value="${escapeAttribute(existingMap?.dataset.mapLon || '')}" placeholder="101.6869"></label>
      </div>
      <label class="map-builder-field"><span>${getText('mapLink')}</span><input id="mapLinkInput" type="url" value="${escapeAttribute(existingLink)}" placeholder="https://maps.google.com/?q=3.139,101.6869"></label>
      <p class="map-builder-hint">${getText('mapLinkHint')}</p>
      <p class="map-builder-status" id="mapBuilderStatus" role="status"></p>
      <div class="map-builder-actions">
        <button class="btn btn-ghost" id="mapCurrentLocation" type="button">${getText('useCurrentLocation')}</button>
        <span class="map-builder-spacer"></span>
        ${targetElement ? `<button class="btn btn-danger" id="mapDelete" type="button">${getText('delete')}</button>` : ''}
        <button class="btn btn-ghost" id="mapCancel" type="button">${getText('cancel')}</button>
        <button class="btn btn-primary" id="mapInsert" type="button">${targetElement ? getText('save') : getText('insertMap')}</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const latitudeInput = backdrop.querySelector('#mapLatitudeInput');
  const longitudeInput = backdrop.querySelector('#mapLongitudeInput');
  const linkInput = backdrop.querySelector('#mapLinkInput');
  const status = backdrop.querySelector('#mapBuilderStatus');
  const close = () => backdrop.remove();
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  };

  linkInput.addEventListener('input', () => {
    const location = parseLocationInput({ link: linkInput.value });
    if (!location) return;
    latitudeInput.value = location.latitude;
    longitudeInput.value = location.longitude;
    setStatus(`${location.latitude}, ${location.longitude}`);
  });
  backdrop.querySelector('#mapCurrentLocation').addEventListener('click', () => {
    if (!navigator.geolocation) {
      setStatus(getText('locationUnavailable'), true);
      return;
    }
    setStatus('...');
    navigator.geolocation.getCurrentPosition((position) => {
      latitudeInput.value = position.coords.latitude.toFixed(7);
      longitudeInput.value = position.coords.longitude.toFixed(7);
      setStatus(`${latitudeInput.value}, ${longitudeInput.value}`);
    }, () => setStatus(getText('locationUnavailable'), true), { enableHighAccuracy: true, timeout: 10000 });
  });
  backdrop.querySelector('#mapCancel').addEventListener('click', close);
  backdrop.querySelector('#mapDelete')?.addEventListener('click', () => {
    confirmModal(getText('confirmDeleteMap'), () => {
      targetElement?.remove();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      close();
    });
  });
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  backdrop.querySelector('#mapInsert').addEventListener('click', () => {
    const location = parseLocationInput({
      latitude: latitudeInput.value,
      longitude: longitudeInput.value,
      link: linkInput.value
    });
    if (!location) {
      setStatus(getText('mapNeedLocation'), true);
      return;
    }
    const markup = buildMapMarkup({
      ...location,
      label: backdrop.querySelector('#mapLabelInput').value.trim() || 'Location'
    });
    if (targetElement?.isConnected) {
      targetElement.replaceWith(document.createRange().createContextualFragment(markup));
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      close();
      return;
    }
    if (insertHtmlAtSelection(textarea, markup)) close();
  });
  backdrop.querySelector('#mapLabelInput').focus();
}

function renderEditor(node) {
  const initialHtml = /^\s*</.test(node.content || '')
    ? sanitizeRenderedHtml(node.content || '')
    : renderMarkdown(node.content || '');

  contentEl.innerHTML = `
    <div class="editor-page-heading">
      <div>
        <span class="editor-page-kicker">${getText('editContent')}</span>
        <h1 class="page-title">${escapeHtml(node.title)}</h1>
      </div>
      <span class="editor-save-state" id="editorSaveState">${getText('editorReady')}</span>
    </div>
    <div class="editor-wrap">
      <div class="editor-panel">
        <div class="editor-header">
          <div class="editor-header-copy">
            <span class="editor-kicker">Editor visual</span>
            <p>Tulis dan format kandungan terus seperti dokumen biasa.</p>
          </div>
          <div class="editor-header-meta">
            <span class="editor-status-badge">Visual</span>
            <span class="editor-character-count" id="editorCharacterCount">0 ${getText('characters')}</span>
          </div>
        </div>

        <div class="editor-toolbar" role="toolbar" aria-label="Toolbar Markdown">
          <div class="editor-tool-switcher">
            <span class="editor-toolbar-label">${getText('editorToolbar')}</span>
            <button type="button" class="editor-tool-mode" id="editorToolMode" aria-label="${getText('switchToolGroup')}">
              <span id="editorToolModeLabel">${getText('textTools')}</span>
              <span aria-hidden="true">⌄</span>
            </button>
          </div>
          <div class="editor-tool-panels">
            <div class="editor-toolbar-group editor-tool-panel" data-tool-panel="text">
              <button class="tb-btn" data-command="formatBlock" data-value="h2" title="${getText('title')}">H</button>
              <button class="tb-btn" data-command="bold" title="${getText('bold')}"><strong>B</strong></button>
              <button class="tb-btn" data-command="italic" title="${getText('italic')}"><em>I</em></button>
              <button class="tb-btn" data-command="createLink" title="${getText('link')}">↗</button>
              <button class="tb-btn" data-command="insertUnorderedList" title="${getText('list')}">☷</button>
              <button class="tb-btn" data-command="insertOrderedList" title="Senarai bernombor">1.</button>
              <button class="tb-btn" data-command="formatBlock" data-value="pre" title="${getText('code')}">&lt;/&gt;</button>
              <button class="tb-btn" data-command="insertTable" title="${getText('table')}">▦</button>
              <button class="tb-btn tb-btn-text" data-command="addTableRow" title="Tambah row">+ Row</button>
              <button class="tb-btn tb-btn-text" data-command="addTableColumn" title="Tambah column">+ Col</button>
              <button class="tb-btn tb-btn-text tb-btn-danger" data-command="deleteTable" title="Padam table">Delete Table</button>
            </div>
            <div class="editor-toolbar-group editor-tool-panel" data-tool-panel="callout" hidden>
              <button class="tb-btn" data-callout="tip" title="${getText('tip')}">💡</button>
              <button class="tb-btn" data-callout="info" title="${getText('info')}">ℹ️</button>
              <button class="tb-btn" data-callout="note" title="${getText('note')}">📝</button>
              <button class="tb-btn" data-callout="warn" title="${getText('warning')}">⚠️</button>
              <button class="tb-btn" data-callout="important" title="${getText('important')}">❗</button>
              <button class="tb-btn" data-callout="success" title="${getText('success')}">✅</button>
              <button class="tb-btn" data-callout="danger" title="${getText('danger')}">⛔</button>
              <button class="tb-btn" data-callout="quote" title="${getText('quote')}">❝</button>
            </div>
            <div class="editor-toolbar-group editor-tool-panel" data-tool-panel="media" hidden>
              <button class="tb-btn" id="btnUploadMedia" title="${getText('uploadMedia')}">📷</button>
              <button class="tb-btn" id="btnInsertFile" title="${getText('insertFile')}">📎</button>
              <button class="tb-btn" id="btnInsertChart" title="${getText('insertChart')}">📊</button>
              <button class="tb-btn" id="btnInsertMap" title="${getText('insertMap')}">📍</button>
            </div>
          </div>
        </div>

        <div class="editor-body">
          <div class="editor-textarea editor-rich-text" id="editorTextarea" contenteditable="true" role="textbox" aria-multiline="true" spellcheck="true">${initialHtml}</div>
        </div>

        <div class="editor-actions">
          <span class="editor-status" id="editorStatus">Editor visual</span>
          <div>
            <button class="btn btn-ghost" id="btnCancelEdit">${getText('cancel')}</button>
            <button class="btn btn-primary" id="btnSaveEdit">💾 ${getText('save')}</button>
          </div>
        </div>
      </div>
    </div>
  `;
  const textarea = document.getElementById('editorTextarea');
  textarea.querySelectorAll('.doc-chart, .media-gallery, .doc-map').forEach((mediaElement) => {
    const nextElement = mediaElement.nextElementSibling;
    if (nextElement?.classList.contains('editor-chart-spacer')) return;
    const spacer = document.createElement('p');
    spacer.className = 'editor-chart-spacer';
    spacer.contentEditable = 'true';
    spacer.innerHTML = '<br>';
    mediaElement.after(spacer);
  });
  [...textarea.children]
    .filter((element) => element.tagName === 'IMG')
    .forEach((imageElement) => {
      const nextElement = imageElement.nextElementSibling;
      if (nextElement?.classList.contains('editor-chart-spacer')) return;
      const spacer = document.createElement('p');
      spacer.className = 'editor-chart-spacer';
      spacer.contentEditable = 'true';
      spacer.innerHTML = '<br>';
      imageElement.after(spacer);
    });
  const trailingParagraph = ensureEditorTrailingParagraph(textarea);
  textarea.addEventListener('click', (event) => {
    if (event.target !== textarea) return;
    trailingParagraph.focus();
    const range = document.createRange();
    range.selectNodeContents(trailingParagraph);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  textarea.addEventListener('click', (event) => {
    const mapElement = event.target.closest?.('.doc-map');
    if (mapElement && textarea.contains(mapElement) && !event.target.closest('.doc-map-reset')) {
      event.preventDefault();
      openMapBuilderModal(textarea, mapElement, mapElement);
      return;
    }
    const chartElement = event.target.closest?.('.doc-chart');
    if (!chartElement || !textarea.contains(chartElement)) return;
    try {
      const chart = JSON.parse(chartElement.dataset.chartDefinition || '');
      openChartBuilderModal(textarea, chart, chartElement);
    } catch {
      chartElement.classList.add('chart-error');
    }
  });
  const editorStatus = document.getElementById('editorSaveState');
  const characterCount = document.getElementById('editorCharacterCount');
  const saveButton = document.getElementById('btnSaveEdit');
  const initialContent = textarea.innerHTML;
  let toolbarSelection = null;
  const updateEditorMeta = () => {
    const hasChanges = textarea.innerHTML !== initialContent;
    characterCount.textContent = `${textarea.textContent.length.toLocaleString()} ${getText('characters')}`;
    editorStatus.textContent = !hasChanges
      ? getText('editorReady')
      : getText('editorUnsaved');
    editorStatus.classList.toggle('is-unsaved', hasChanges);
    saveButton.disabled = !hasChanges;
    renderInlineEditorMediaControls(textarea);
  };
  textarea.addEventListener('input', updateEditorMeta);
  updateEditorMeta();

  const toolModes = [
    { key: 'text', label: 'textTools' },
    { key: 'callout', label: 'calloutTools' },
    { key: 'media', label: 'mediaTools' }
  ];
  const toolModeButton = document.getElementById('editorToolMode');
  const toolModeLabel = document.getElementById('editorToolModeLabel');
  const toolPanels = contentEl.querySelectorAll('.editor-tool-panel');
  let activeToolMode = toolModes.findIndex((mode) => mode.key === getDefaultEditorToolMode());
  if (activeToolMode < 0) activeToolMode = 0;
  const updateToolMode = () => {
    const mode = toolModes[activeToolMode];
    toolModeLabel.textContent = getText(mode.label);
    toolModeButton.dataset.mode = mode.key;
    toolPanels.forEach((panel) => {
      panel.hidden = panel.dataset.toolPanel !== mode.key;
    });
  };
  toolModeButton.addEventListener('click', () => {
    activeToolMode = (activeToolMode + 1) % toolModes.length;
    updateToolMode();
  });
  updateToolMode();

  document.getElementById('btnUploadMedia').addEventListener('click', () => openMediaUploadModal(textarea));
  document.getElementById('btnInsertFile').addEventListener('click', () => openFileUploadModal(textarea));
  document.getElementById('btnInsertChart').addEventListener('click', () => openChartBuilderModal(textarea));
  document.getElementById('btnInsertMap').addEventListener('click', () => openMapBuilderModal(textarea));
  contentEl.querySelectorAll('.tb-btn').forEach(button => {
    if (!button.dataset.command && !button.dataset.callout) return;
    button.addEventListener('mousedown', (event) => {
      toolbarSelection = getEditorSelectionRange(textarea);
      event.preventDefault();
    });
    button.addEventListener('click', () => {
      restoreEditorSelection(textarea, toolbarSelection);

      if (button.dataset.callout) {
        const variant = button.dataset.callout;
        applyCalloutToSelection(textarea, variant);
        updateEditorMeta();
        return;
      }

      if (button.dataset.command === 'createLink') {
        const url = window.prompt('Pautan', 'https://');
        if (url) document.execCommand('createLink', false, url);
      } else if (button.dataset.command === 'insertTable') {
        insertTableAtSelection(textarea);
      } else if (button.dataset.command === 'addTableRow') {
        addTableRow(textarea);
      } else if (button.dataset.command === 'addTableColumn') {
        addTableColumn(textarea);
      } else if (button.dataset.command === 'deleteTable') {
        deleteSelectedTable(textarea);
      } else {
        const commandValue = button.dataset.command === 'formatBlock'
          ? `<${button.dataset.value}>`
          : button.dataset.value || null;
        document.execCommand(button.dataset.command, false, commandValue);
      }
      updateEditorMeta();
    });
  });
  document.getElementById('btnCancelEdit').addEventListener('click', renderContent);
  const saveEditor = () => {
    if (textarea.innerHTML === initialContent) return;
    const editorContent = textarea.cloneNode(true);
    editorContent.querySelectorAll('.editor-media-controls').forEach((controls) => controls.remove());
    editorContent.querySelectorAll('.editor-media-hidden').forEach((element) => element.classList.remove('editor-media-hidden'));
    editorContent.querySelectorAll('.editor-chart-spacer').forEach((spacer) => {
      spacer.classList.remove('editor-chart-spacer');
      spacer.removeAttribute('contenteditable');
      if (!spacer.textContent.trim()) spacer.remove();
    });
    editorContent.querySelectorAll('.editor-trailing-paragraph').forEach((paragraph) => {
      if (!paragraph.textContent.trim()) paragraph.remove();
    });
    node.content = sanitizeRenderedHtml(editorContent.innerHTML);
    touchNode(node);
    saveState();
    renderContent();
  };
  saveButton.addEventListener('click', saveEditor);
  textarea.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveEditor();
    }
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Modal (add/rename) ---------- */
function promptModal(title, placeholder, initial, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>${escapeHtml(title)}</h3>
      <input type="text" id="modalInput" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(initial || '')}">
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modalCancel">${getText('cancel')}</button>
        <button class="btn btn-primary" id="modalOk">${getText('ok')}</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  const input = backdrop.querySelector('#modalInput');
  input.focus();
  input.select();

  const close = () => backdrop.remove();
  backdrop.querySelector('#modalCancel').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('#modalOk').addEventListener('click', () => {
    const val = input.value.trim();
    close();
    onConfirm(val);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') backdrop.querySelector('#modalOk').click();
    if (e.key === 'Escape') close();
  });
}

function confirmModal(message, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>${getText('confirmAction')}</h3>
      <p style="color:var(--text-muted); font-size:14px; margin-top:-6px;">${escapeHtml(message)}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modalCancel">${getText('cancel')}</button>
        <button class="btn btn-danger" id="modalOk">${getText('delete')}</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.querySelector('#modalCancel').addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('#modalOk').addEventListener('click', () => { close(); onConfirm(); });
}

function getLanguage() {
  return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ms';
}

function updateBrandName() {
  const title = normalizeBookTitle(state.bookTitle);
  document.querySelectorAll('.brand-name').forEach((brandNameEl) => {
    brandNameEl.textContent = title;
  });
  document.title = `${title} — Modern Documentation`;
  state.bookTitle = title;
}

function getText(key) {
  return translations[getLanguage()][key] || key;
}

function applyLanguage(lang) {
  const active = lang === 'en' ? 'en' : 'ms';
  document.documentElement.lang = active;
  localStorage.setItem(LANG_KEY, active);
  syncSettingsPanel();

  const searchInputEl = document.getElementById('searchInput');
  if (searchInputEl) searchInputEl.placeholder = getText('searchPlaceholder');

  const settingsBtn = document.getElementById('settingsButton');
  if (settingsBtn) settingsBtn.title = getText('settings');
  settingsBtn?.setAttribute('aria-label', getText('settings'));
  const shareBtn = document.getElementById('shareButton');
  if (shareBtn) shareBtn.title = getText('share');
  shareBtn?.setAttribute('aria-label', getText('share'));

  const addRootPageBtn = document.getElementById('addRootPage');
  if (addRootPageBtn) {
    const icon = addRootPageBtn.querySelector('svg');
    addRootPageBtn.innerHTML = `${icon ? icon.outerHTML : ''}${getText('addMenu')}`;
  }

  const editToggle = document.getElementById('editModeToggle');
  if (editToggle) {
    const label = editToggle.querySelector('span');
    if (label) label.textContent = getText('editMode');
  }

  if (document.body && document.body.dataset) {
    renderTree();
    renderContent();
  }
}

function syncSettingsPanel() {
  const panel = document.querySelector('.settings-panel');
  if (!panel) return;

  const activeLang = getLanguage();
  const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  panel.querySelectorAll('[name="langChoice"]').forEach((radio) => {
    radio.checked = radio.value === activeLang;
  });

  const editToggle = panel.querySelector('#settingsEditToggle');
  if (editToggle) editToggle.checked = document.body.classList.contains('edit-mode');

  panel.querySelectorAll('[name="themeChoice"]').forEach((radio) => {
    radio.checked = radio.value === theme;
  });

  const tableColorInput = panel.querySelector('#tableHeaderColorInput');
  if (tableColorInput) tableColorInput.value = state.tableSettings.headerColor;
  const tableAlignInput = panel.querySelector(`[name="tableTextAlign"][value="${state.tableSettings.textAlign}"]`);
  if (tableAlignInput) tableAlignInput.checked = true;
}

function openSettingsPanel() {
  const existing = document.querySelector('.settings-backdrop');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'settings-backdrop';
  backdrop.innerHTML = `
    <div class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settingsDialogTitle">
      <aside class="settings-sidebar">
        <div class="settings-sidebar-heading">
          <span class="settings-sidebar-mark"><i class="fa-solid fa-gear" aria-hidden="true"></i></span>
          <span>${getText('settings')}</span>
        </div>
        <nav class="settings-nav" aria-label="${getText('settings')}">
          <button type="button" class="settings-nav-item is-active" data-settings-tab="general" aria-selected="true" aria-controls="settings-general">
            <i class="fa-solid fa-sliders" aria-hidden="true"></i>
            <span>${getText('general')}</span>
          </button>
          <button type="button" class="settings-nav-item" data-settings-tab="appearance" aria-selected="false" aria-controls="settings-appearance">
            <i class="fa-solid fa-palette" aria-hidden="true"></i>
            <span>${getText('appearance')}</span>
          </button>
          <button type="button" class="settings-nav-item" data-settings-tab="table" aria-selected="false" aria-controls="settings-table">
            <i class="fa-solid fa-table-cells-large" aria-hidden="true"></i>
            <span>${getText('tableSettings')}</span>
          </button>
        </nav>
      </aside>

      <div class="settings-main">
        <div class="settings-header">
          <div>
            <p class="settings-eyebrow">${getText('settings')}</p>
            <h3 id="settingsDialogTitle">${getText('general')}</h3>
            <p class="settings-description" data-settings-description>${getText('generalDescription')}</p>
          </div>
          <button class="icon-btn settings-close-btn" id="closeSettingsBtn" aria-label="${getText('close')}">×</button>
        </div>

        <div class="settings-scroll">
          <section class="settings-pane is-active" id="settings-general" data-settings-pane="general" role="tabpanel">
            <div class="settings-section">
              <div class="settings-field-copy">
                <label>${getText('language')}</label>
                <p>${getText('languageDescription')}</p>
              </div>
              <div class="segmented">
                <label><input type="radio" name="langChoice" value="ms" ${getLanguage() === 'ms' ? 'checked' : ''}><span>BM</span></label>
                <label><input type="radio" name="langChoice" value="en" ${getLanguage() === 'en' ? 'checked' : ''}><span>EN</span></label>
              </div>
            </div>

            <div class="settings-section">
              <div class="settings-field-copy">
                <label for="recipeBookNameInput">${getText('bookTitle')}</label>
                <p>${getText('bookTitleDescription')}</p>
              </div>
              <input id="recipeBookNameInput" type="text" value="${escapeAttribute(state.bookTitle || DEFAULT_BOOK_TITLE)}" maxlength="40" placeholder="RecipeBook">
            </div>
          </section>

          <section class="settings-pane" id="settings-appearance" data-settings-pane="appearance" role="tabpanel" hidden>
            <div class="settings-section">
              <div class="settings-field-copy">
                <label>${getText('theme')}</label>
                <p>${getText('themeDescription')}</p>
              </div>
              <div class="segmented">
                <label><input type="radio" name="themeChoice" value="light" ${document.documentElement.classList.contains('dark') ? '' : 'checked'}><span>${getText('light')}</span></label>
                <label><input type="radio" name="themeChoice" value="dark" ${document.documentElement.classList.contains('dark') ? 'checked' : ''}><span>${getText('dark')}</span></label>
              </div>
            </div>

            <div class="settings-section">
              <div class="settings-field-copy">
                <label>${getText('editMode')}</label>
                <p>${getText('editModeDescription')}</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="settingsEditToggle" ${document.body.classList.contains('edit-mode') ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </section>

          <section class="settings-pane" id="settings-table" data-settings-pane="table" role="tabpanel" hidden>
            <div class="settings-section">
              <div class="settings-field-copy">
                <label for="tableHeaderColorInput">${getText('tableHeaderColor')}</label>
                <p>${getText('tableHeaderColorDescription')}</p>
              </div>
              <input id="tableHeaderColorInput" class="settings-color-input" type="color" value="${escapeAttribute(state.tableSettings.headerColor)}">
            </div>

            <div class="settings-section">
              <div class="settings-field-copy">
                <label>${getText('tableTextAlign')}</label>
              </div>
              <div class="segmented">
                <label><input type="radio" name="tableTextAlign" value="left" ${state.tableSettings.textAlign === 'left' ? 'checked' : ''}><span>${getText('alignLeft')}</span></label>
                <label><input type="radio" name="tableTextAlign" value="center" ${state.tableSettings.textAlign === 'center' ? 'checked' : ''}><span>${getText('alignCenter')}</span></label>
                <label><input type="radio" name="tableTextAlign" value="right" ${state.tableSettings.textAlign === 'right' ? 'checked' : ''}><span>${getText('alignRight')}</span></label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });

  document.getElementById('closeSettingsBtn').addEventListener('click', close);

  const settingsTabDescriptionKeys = {
    general: 'generalDescription',
    appearance: 'appearanceDescription',
    table: 'tableSettingsDescription'
  };
  backdrop.querySelectorAll('[data-settings-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const section = tab.dataset.settingsTab;
      backdrop.querySelectorAll('[data-settings-tab]').forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      backdrop.querySelectorAll('[data-settings-pane]').forEach((pane) => {
        const isActive = pane.dataset.settingsPane === section;
        pane.classList.toggle('is-active', isActive);
        pane.hidden = !isActive;
      });
      const title = backdrop.querySelector('#settingsDialogTitle');
      const description = backdrop.querySelector('[data-settings-description]');
      if (title) title.textContent = getText(section);
      if (description) description.textContent = getText(settingsTabDescriptionKeys[section]);
    });
  });

  backdrop.querySelectorAll('[name="langChoice"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      applyLanguage(radio.value);
    });
  });

  backdrop.querySelector('#settingsEditToggle').addEventListener('change', (event) => {
    setEditMode(event.target.checked);
  });

  const recipeBookNameInput = backdrop.querySelector('#recipeBookNameInput');
  recipeBookNameInput.addEventListener('change', (event) => {
    const nextTitle = normalizeBookTitle(event.target.value);
    state.bookTitle = nextTitle;
    event.target.value = nextTitle;
    updateBrandName();
    saveState();
  });

  backdrop.querySelector('#tableHeaderColorInput').addEventListener('input', (event) => {
    state.tableSettings = normalizeTableSettings({
      ...state.tableSettings,
      headerColor: event.target.value
    });
    applyTableSettings();
    saveState();
  });

  backdrop.querySelectorAll('[name="tableTextAlign"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.tableSettings = normalizeTableSettings({
        ...state.tableSettings,
        textAlign: radio.value
      });
      applyTableSettings();
      saveState();
    });
  });

  backdrop.querySelectorAll('[name="themeChoice"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      applyTheme(radio.value);
    });
  });
}

function initSettings() {
  const btn = document.getElementById('settingsButton');
  if (!btn) return;

  btn.addEventListener('click', openSettingsPanel);
}

let closeSharePopover = null;

function openSharePopover() {
  closeSharePopover?.();
  const node = state.activeId ? findNode(state.activeId) : null;
  const shareButton = document.getElementById('shareButton');
  if (!node || !shareButton) return;

  syncSharedPageUrl(node.id);
  const shareUrl = window.location.href;
  const backdrop = document.createElement('div');
  backdrop.className = 'share-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  const popover = document.createElement('div');
  popover.id = 'sharePopover';
  popover.className = 'share-popover';
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-labelledby', 'sharePopoverTitle');
  popover.innerHTML = `
    <div class="share-popover-header">
      <div class="share-popover-heading">
        <span class="share-popover-icon" aria-hidden="true">↗</span>
        <div>
          <h3 id="sharePopoverTitle">${escapeHtml(getText('sharePage'))}</h3>
          <p>${escapeHtml(getText('shareHint'))}</p>
        </div>
      </div>
      <button type="button" class="icon-btn share-close" aria-label="${escapeAttribute(getText('close'))}">×</button>
    </div>
    <label class="share-link-label" for="shareLinkInput">${escapeHtml(getText('shareLink'))}</label>
    <div class="share-link-row">
      <input id="shareLinkInput" type="text" readonly value="${escapeAttribute(shareUrl)}">
      <button type="button" class="btn btn-primary" id="copyShareLink">${escapeHtml(getText('copyLink'))}</button>
    </div>
    <button type="button" class="btn btn-ghost share-native-button" id="nativeShareButton">${escapeHtml(getText('nativeShare'))}</button>
    <p class="share-status" id="shareStatus" aria-live="polite"></p>
  `;
  document.body.append(backdrop, popover);

  const linkInput = popover.querySelector('#shareLinkInput');
  const copyButton = popover.querySelector('#copyShareLink');
  const nativeShareButton = popover.querySelector('#nativeShareButton');
  const status = popover.querySelector('#shareStatus');
  const closeButton = popover.querySelector('.share-close');

  const close = () => {
    backdrop.remove();
    popover.remove();
    document.removeEventListener('pointerdown', handleOutsideClick);
    document.removeEventListener('keydown', handleEscape);
    if (closeSharePopover === close) closeSharePopover = null;
  };
  const handleOutsideClick = (event) => {
    if (event.target === backdrop || (!popover.contains(event.target) && event.target !== shareButton)) close();
  };
  const handleEscape = (event) => {
    if (event.key === 'Escape') close();
  };
  closeSharePopover = close;
  closeButton.addEventListener('click', close);
  linkInput.addEventListener('focus', () => linkInput.select());
  copyButton.addEventListener('click', async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        linkInput.focus();
        linkInput.select();
        if (!document.execCommand('copy')) throw new Error('Copy not supported');
      }
      status.textContent = getText('copiedLink');
      copyButton.textContent = getText('copiedLink');
      window.setTimeout(() => {
        if (document.body.contains(copyButton)) copyButton.textContent = getText('copyLink');
      }, 1800);
    } catch {
      linkInput.focus();
      linkInput.select();
      status.textContent = getText('shareLink');
    }
  });
  nativeShareButton.hidden = typeof navigator.share !== 'function';
  nativeShareButton.addEventListener('click', async () => {
    try {
      await navigator.share({ title: node.title, text: getText('sharePage'), url: shareUrl });
      status.textContent = getText('copiedLink');
    } catch (error) {
      if (error?.name !== 'AbortError') status.textContent = getText('shareLink');
    }
  });
  document.addEventListener('pointerdown', handleOutsideClick);
  document.addEventListener('keydown', handleEscape);
  linkInput.focus();
  linkInput.select();
}

function initShare() {
  const btn = document.getElementById('shareButton');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (closeSharePopover) closeSharePopover();
    else openSharePopover();
  });
}

/* ---------- Edit mode toggle ---------- */
function initEditMode() {
  const btn = document.getElementById('editModeToggle');
  const enabled = localStorage.getItem(EDIT_KEY) === 'true';
  setEditMode(enabled);

  if (!btn) return;

  btn.addEventListener('click', () => {
    setEditMode(!document.body.classList.contains('edit-mode'));
  });
}

function setEditMode(on) {
  const wasInEditor = !!document.querySelector('.editor-wrap');
  document.body.classList.toggle('edit-mode', on);
  const editBtn = document.getElementById('editModeToggle');
  if (editBtn) editBtn.classList.toggle('active', on);
  const label = editBtn?.querySelector('span');
  if (label) label.textContent = getText('editMode');
  localStorage.setItem(EDIT_KEY, on ? 'true' : 'false');
  syncSettingsPanel();
  const node = state.activeId ? findNode(state.activeId) : null;
  if (!on) {
    document.querySelector('#uploadPasswordCancel')?.click();
    document.querySelectorAll('.modal-backdrop').forEach((modal) => modal.remove());
    if (wasInEditor || node) renderContent();
    return;
  }
  if (node) applyEditModeToTitle(node);
}

/* ---------- Theme toggle ---------- */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(saved);

  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const sun = document.getElementById('iconSun');
  const moon = document.getElementById('iconMoon');
  if (sun) sun.style.display = theme === 'dark' ? 'none' : 'block';
  if (moon) moon.style.display = theme === 'dark' ? 'block' : 'none';
  localStorage.setItem(THEME_KEY, theme);
  syncSettingsPanel();
}

function applyTableSettings() {
  const settings = normalizeTableSettings(state.tableSettings);
  state.tableSettings = settings;
  document.documentElement.style.setProperty('--table-header-bg', settings.headerColor);
  document.documentElement.style.setProperty('--table-text-align', settings.textAlign);
}

/* ---------- Sidebar toggle (mobile) ---------- */
function initSidebarToggle() {
  const toggle = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');
  const mediaQuery = window.matchMedia('(max-width: 800px)');

  const syncOverlay = () => {
    const showOverlay = mediaQuery.matches && !document.body.classList.contains('sidebar-collapsed');
    overlay.classList.toggle('visible', showOverlay);
  };

  const collapsed = localStorage.getItem(SIDEBAR_KEY) === 'true';
  applySidebarState(collapsed);
  syncOverlay();

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const next = !document.body.classList.contains('sidebar-collapsed');
    applySidebarState(next);
    syncOverlay();
  });

  overlay.addEventListener('click', () => {
    applySidebarState(true);
    syncOverlay();
  });

  document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickedInsideSidebar = sidebarEl.contains(target);
    const clickedToggle = toggle.contains(target);
    const clickedOverlay = overlay.contains(target);
    const clickedContent = contentEl.contains(target);
    const isMobile = mediaQuery.matches;
    const sidebarOpen = !document.body.classList.contains('sidebar-collapsed');

    if (!isMobile || !sidebarOpen) return;
    if (clickedInsideSidebar || clickedToggle || clickedOverlay) return;
    if (!clickedContent) return;

    applySidebarState(true);
    syncOverlay();
  });

  window.addEventListener('resize', () => {
    const isMobile = mediaQuery.matches;
    if (!isMobile) {
      sidebarEl.classList.remove('mobile-open');
      overlay.classList.remove('visible');
    }
    syncOverlay();
  });
}

function applySidebarState(collapsed) {
  const isMobile = window.innerWidth <= 800;
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  sidebarEl.classList.toggle('collapsed', collapsed);
  sidebarEl.setAttribute('aria-expanded', String(!collapsed));
  localStorage.setItem(SIDEBAR_KEY, String(collapsed));

  if (isMobile) {
    sidebarEl.classList.toggle('mobile-open', !collapsed);
  } else {
    sidebarEl.classList.remove('mobile-open');
  }
}

/* ---------- Add root page ---------- */
function initAddRoot() {
  document.getElementById('addRootPage').addEventListener('click', () => {
    promptModal('Tambah Menu', 'Nama menu', '', (title) => {
      if (!title) return;
      const newNode = { id: uid(), title, content: `# ${title}\n\nTulis kandungan di sini…`, children: [], updatedAt: Date.now() };
      state.pages.push(newNode);
      state.activeId = newNode.id;
      saveState();
      renderTree();
      renderContent();
    });
  });
}

function initDataTransfer() {
  document.getElementById('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.pages, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `docbook-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btnExportMarkdown').addEventListener('click', () => {
    const node = state.activeId ? findNode(state.activeId) : null;
    if (!node) return;
    const content = `# ${node.title}\n\n${node.content || ''}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${node.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  });

  const fileInput = document.getElementById('importFile');
  document.getElementById('btnImport').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error('Format tidak sah');
        const normalized = normalizeDocumentState({
          pages: imported,
          activeId: imported[0]?.id,
          bookTitle: state.bookTitle
        });
        state.pages = normalized.pages;
        state.activeId = normalized.activeId;
        ensurePageTimestamps(state.pages);
        saveState();
        renderTree();
        renderContent();
      } catch (error) {
        alert('Fail import tidak sah. Sila pilih sandaran DocBook yang betul.');
      }
      fileInput.value = '';
    };
    reader.readAsText(file);
  });
}

/* ---------- Search ---------- */
function initSearch() {
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    const q = query.toLowerCase();
    if (!q) { renderTree(); return; }
    const all = flattenSearch();
    const matchIds = new Set(all.filter(n => n.title.toLowerCase().includes(q)).map(n => n.id));
    // Expand ancestors of matches and filter render
    menuTreeEl.innerHTML = '';
    if (!matchIds.size) {
      const emptyState = document.createElement('div');
      emptyState.className = 'search-empty-state';
      emptyState.innerHTML = `
        <strong>${escapeHtml(getText('searchNotFound').replace('{query}', query))}</strong>
        <span>${escapeHtml(getText('searchSuggestion'))}</span>
      `;
      menuTreeEl.appendChild(emptyState);
      return;
    }
    state.pages.forEach(node => {
      const el = renderFilteredNode(node, matchIds, q);
      if (el) menuTreeEl.appendChild(el);
    });
  });
}

function nodeOrDescendantMatches(node, matchIds) {
  if (matchIds.has(node.id)) return true;
  return node.children.some(c => nodeOrDescendantMatches(c, matchIds));
}

function renderFilteredNode(node, matchIds, q) {
  if (!nodeOrDescendantMatches(node, matchIds)) return null;
  node._expanded = true;
  return renderTreeNode(node);
}

/* ---------- Init ---------- */
function arrangeContentLayout() {
  const layout = document.querySelector('.layout');
  const topbar = document.querySelector('.topbar');
  const content = document.getElementById('content');
  if (!layout || !topbar || !content || layout.querySelector('.main-shell')) return;

  const mainShell = document.createElement('div');
  mainShell.className = 'main-shell';
  layout.appendChild(mainShell);
  mainShell.append(topbar, content);

  const brand = topbar.querySelector('.brand');
  const topbarLeft = topbar.querySelector('.topbar-left');
  const sidebarHeader = document.querySelector('.sidebar-header');
  const sidebarSearch = sidebarHeader?.querySelector('.sidebar-search');
  if (brand && topbarLeft && sidebarHeader && sidebarSearch) {
    sidebarHeader.insertBefore(brand, sidebarSearch);
    topbarLeft.classList.add('brand-moved');
  }
}

async function init() {
  arrangeContentLayout();
  await loadState();
  applyTableSettings();
  updateBrandName();
  applyLanguage(getLanguage());
  initTheme();
  initEditMode();
  initSettings();
  initShare();
  initSidebarToggle();
  initAddRoot();
  initDataTransfer();
  initSearch();
  renderTree();
  renderContent();
}

document.addEventListener('DOMContentLoaded', init);
