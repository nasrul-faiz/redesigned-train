function findClosingBracket(source, start) {
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === '\\') {
      index += 1;
      continue;
    }
    if (source[index] === ']') return index;
  }
  return -1;
}

function findClosingParenthesis(source, start) {
  let depth = 1;
  let quote = '';

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === '\\') {
      index += 1;
      continue;
    }

    if (quote) {
      if (char === quote) quote = '';
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function parseDestination(value) {
  const trimmed = value.trim();
  if (!trimmed) return { src: '', title: '' };

  if (trimmed.startsWith('<')) {
    const end = trimmed.indexOf('>');
    if (end !== -1) {
      return {
        src: trimmed.slice(1, end),
        title: trimmed.slice(end + 1).trim().replace(/^["']|["']$/g, '')
      };
    }
  }

  const titled = trimmed.match(/^(.+?)(?:\s+(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)'))$/);
  if (titled) {
    return {
      src: titled[1],
      title: titled[2] ?? titled[3] ?? ''
    };
  }

  return { src: trimmed, title: '' };
}

export function parseMarkdownImages(text) {
  const source = String(text || '');
  const images = [];

  for (let start = 0; start < source.length - 3; start += 1) {
    if (source[start] !== '!' || source[start + 1] !== '[') continue;

    const captionEnd = findClosingBracket(source, start + 2);
    if (captionEnd === -1 || source[captionEnd + 1] !== '(') continue;

    const destinationEnd = findClosingParenthesis(source, captionEnd + 2);
    if (destinationEnd === -1) continue;

    const destination = parseDestination(source.slice(captionEnd + 2, destinationEnd));
    if (!destination.src) continue;

    images.push({
      start,
      end: destinationEnd + 1,
      syntax: 'markdown',
      caption: source.slice(start + 2, captionEnd),
      src: destination.src,
      title: destination.title
    });
    start = destinationEnd;
  }

  return images;
}

export function serializeMarkdownImage({ caption, src, title = '' }) {
  const safeCaption = String(caption || '').replace(/[\r\n\[\]]/g, '').trim() || 'Imej';
  const safeTitle = String(title || '').replace(/[\r\n"]/g, '').trim();
  return `![${safeCaption}](${src}${safeTitle ? ` "${safeTitle}"` : ''})`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function markdownImagesToGalleryMarkup(source = '') {
  const images = parseMarkdownImages(source);
  if (!images.length) return '';

  const visibleCount = Math.min(3, images.length);
  const overflowCount = Math.max(0, images.length - visibleCount);
  const galleryClass = `media-gallery media-gallery-grid-${visibleCount}`;

  const markup = images.map((image, index) => {
    const caption = image.caption || 'Image';
    const href = escapeHtml(image.src);
    const alt = escapeHtml(caption);
    const isOverflow = index >= visibleCount;
    const moreOverlay = index === visibleCount - 1 && overflowCount
      ? `<span class="media-more-overlay">+${overflowCount} more image${overflowCount === 1 ? '' : 's'}</span>`
      : '';
    return `<a href="${href}" class="media-item${isOverflow ? ' media-item-overflow' : ''}" data-media-type="image" data-sub-html="${escapeHtml(caption)}" aria-label="${alt}"><img src="${href}" alt="${alt}" />${moreOverlay}</a>`;
  }).join('');

  return `<div class="${galleryClass}" data-overflow-count="${overflowCount}">${markup}</div>`;
}