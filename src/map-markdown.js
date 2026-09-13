const COORDINATE_PATTERN = /(-?\d{1,3}(?:\.\d+)?)[,\/\s]+(-?\d{1,3}(?:\.\d+)?)/g;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validCoordinate(latitude, longitude) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

export function parseLocationInput({ latitude = '', longitude = '', link = '' } = {}) {
  let lat = Number.parseFloat(latitude);
  let lon = Number.parseFloat(longitude);
  const source = String(link || '').trim();

  if (!validCoordinate(lat, lon) && source) {
    const mapHash = source.match(/(?:#|[?&])map=\d+\/(-?\d{1,3}(?:\.\d+)?)\/(-?\d{1,3}(?:\.\d+)?)/i);
    if (mapHash) {
      lat = Number.parseFloat(mapHash[1]);
      lon = Number.parseFloat(mapHash[2]);
    }
    for (const match of source.matchAll(COORDINATE_PATTERN)) {
      if (validCoordinate(lat, lon)) break;
      const first = Number.parseFloat(match[1]);
      const second = Number.parseFloat(match[2]);
      if (validCoordinate(first, second)) {
        lat = first;
        lon = second;
        break;
      }
      if (validCoordinate(second, first)) {
        lat = second;
        lon = first;
        break;
      }
    }
  }

  if (!validCoordinate(lat, lon)) {
    try {
      const url = new URL(source);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      return { latitude: null, longitude: null, link: source };
    } catch {
      return null;
    }
  }
  return {
    latitude: Number(lat.toFixed(7)),
    longitude: Number(lon.toFixed(7)),
    link: source
  };
}

export function buildMapEmbedUrl(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const delta = 0.012;
  const params = new URLSearchParams({
    bbox: `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`,
    layer: 'mapnik',
    marker: `${lat},${lon}`
  });
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

export function buildMapMarkup({ latitude, longitude, link = '', label = 'Location' }) {
  const location = parseLocationInput({ latitude, longitude, link });
  if (!location) return '';
  const openUrl = location.link || `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`;
  const mapFrame = Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
    ? `<iframe title="${escapeHtml(label || 'Location')}" src="${escapeHtml(buildMapEmbedUrl(location.latitude, location.longitude))}" loading="lazy"></iframe>`
    : '';
  const marker = mapFrame ? '<span class="doc-map-marker" aria-hidden="true"><i class="fa-solid fa-location-dot"></i></span>' : '';
  return `<div class="doc-map" data-map-lat="${location.latitude ?? ''}" data-map-lon="${location.longitude ?? ''}" data-map-link="${escapeHtml(openUrl)}"><div class="doc-map-heading"><strong>${escapeHtml(label || 'Location')}</strong><a href="${escapeHtml(openUrl)}" target="_blank" rel="noopener noreferrer">Open map</a></div>${mapFrame}${marker}</div>`;
}