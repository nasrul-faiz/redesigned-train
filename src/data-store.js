export const DEFAULT_BOOK_TITLE = 'RecipeBook';
export const DEFAULT_TABLE_SETTINGS = {
  headerColor: '#0f766e',
  textAlign: 'left'
};

const TABLE_ALIGNMENTS = new Set(['left', 'center', 'right']);

export function normalizeTableSettings(value) {
  const source = value && typeof value === 'object' ? value : {};
  const headerColor = typeof source.headerColor === 'string'
    && /^#[0-9a-f]{6}$/i.test(source.headerColor)
    ? source.headerColor.toLowerCase()
    : DEFAULT_TABLE_SETTINGS.headerColor;
  const textAlign = TABLE_ALIGNMENTS.has(source.textAlign)
    ? source.textAlign
    : DEFAULT_TABLE_SETTINGS.textAlign;

  return { headerColor, textAlign };
}

export function normalizeBookTitle(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || DEFAULT_BOOK_TITLE;
}

function normalizeRecipeValue(value) {
  if (!value || typeof value !== 'object') return undefined;

  const ingredients = Array.isArray(value.ingredients)
    ? value.ingredients.map((entry) => String(entry ?? '').trim()).filter(Boolean).slice(0, 200)
    : [];
  const steps = Array.isArray(value.steps)
    ? value.steps.map((entry) => String(entry ?? '').trim()).filter(Boolean).slice(0, 200)
    : [];
  const tags = Array.isArray(value.tags)
    ? value.tags.map((entry) => String(entry ?? '').trim()).filter(Boolean).slice(0, 50)
    : [];

  const recipe = {
    title: typeof value.title === 'string' ? value.title.trim().slice(0, 200) : '',
    category: typeof value.category === 'string' ? value.category.trim().slice(0, 100) : '',
    servings: Number.isFinite(Number(value.servings)) ? Number(value.servings) : undefined,
    prepTime: Number.isFinite(Number(value.prepTime)) ? Number(value.prepTime) : undefined,
    cookTime: Number.isFinite(Number(value.cookTime)) ? Number(value.cookTime) : undefined,
    difficulty: typeof value.difficulty === 'string' ? value.difficulty.trim().slice(0, 50) : '',
    image: typeof value.image === 'string' ? value.image.trim().slice(0, 1000) : '',
    ingredients,
    steps,
    notes: typeof value.notes === 'string' ? value.notes.trim().slice(0, 2000) : '',
    tags
  };

  const hasMeaningfulRecipeData = Object.values(recipe).some((entry) => {
    if (Array.isArray(entry)) return entry.length > 0;
    return typeof entry === 'string' ? entry.length > 0 : typeof entry === 'number' && Number.isFinite(entry);
  });

  return hasMeaningfulRecipeData ? recipe : undefined;
}

export function seedData() {
  return [
    {
      id: uid(),
      title: 'Pengenalan',
      children: [],
      content: `# Selamat Datang 👋

Ini adalah **DocBook**, sistem dokumentasi moden bergaya GitBook.

- Klik **Edit Mode** di penjuru atas untuk mula menyunting
- Guna butang **+** pada sidebar untuk tambah menu / submenu
- Tulis kandungan dalam format **Markdown**

> Semua perubahan disimpan automatik pada pelayar anda (localStorage).`
    },
    {
      id: uid(),
      title: 'Panduan Bermula',
      children: [
        {
          id: uid(),
          title: 'Pasang',
          children: [],
          content: `## Pasang DocBook\n\nTiada pemasangan diperlukan — cuma buka \`index.html\` dalam pelayar.`
        },
        {
          id: uid(),
          title: 'Konfigurasi',
          children: [],
          content: `## Konfigurasi\n\nUbah suai struktur menu terus dari sidebar semasa **Edit Mode** aktif.`
        }
      ],
      content: `# Panduan Bermula\n\nBahagian ini mengandungi submenu untuk membantu anda bermula.`
    },
    {
      id: uid(),
      title: 'Rujukan API',
      children: [],
      content: `# Rujukan API\n\n\`\`\`js\nfunction hello() {\n  console.log("Hello DocBook!");\n}\n\`\`\``
    }
  ];
}

export function uid() {
  return 'p_' + Math.random().toString(36).slice(2, 10);
}

function normalizePageNodes(input, seenIds = new Set(), depth = 0, counter = { value: 0 }) {
  if (!Array.isArray(input) || depth > 20) return [];

  return input.flatMap((value) => {
    if (!value || typeof value !== 'object' || counter.value >= 1000) return [];
    counter.value += 1;

    let id = typeof value.id === 'string' ? value.id.trim().slice(0, 120) : '';
    if (!id || seenIds.has(id)) id = uid();
    seenIds.add(id);

    const recipe = normalizeRecipeValue(value.recipe);

    const node = {
      id,
      title: typeof value.title === 'string' && value.title.trim()
        ? value.title.trim().slice(0, 300)
        : 'Untitled',
      content: typeof value.content === 'string' ? value.content.slice(0, 2_000_000) : '',
      children: normalizePageNodes(value.children, seenIds, depth + 1, counter),
      ...(recipe ? { recipe } : {})
    };

    const timestamp = typeof value.updatedAt === 'number'
      ? value.updatedAt
      : Date.parse(value.updatedAt || '');
    if (Number.isFinite(timestamp)) node.updatedAt = timestamp;
    if (typeof value._expanded === 'boolean') node._expanded = value._expanded;
    return [node];
  });
}

export function normalizeDocumentState(raw = {}) {
  const normalizedPages = normalizePageNodes(raw.pages);
  const pages = normalizedPages.length > 0 ? normalizedPages : seedData();
  const pageIds = new Set();
  const collectIds = (nodes) => nodes.forEach((node) => {
    pageIds.add(node.id);
    collectIds(node.children);
  });
  collectIds(pages);

  const activeId = typeof raw.activeId === 'string' && pageIds.has(raw.activeId)
    ? raw.activeId
    : pages[0]?.id || null;
  const bookTitle = normalizeBookTitle(raw.bookTitle);
  const tableSettings = normalizeTableSettings(raw.tableSettings);

  return {
    pages,
    activeId,
    bookTitle,
    tableSettings
  };
}

export function hasUnsavedChanges(currentValue, lastSavedValue) {
  if (currentValue == null && lastSavedValue == null) return false;
  return currentValue !== lastSavedValue;
}
