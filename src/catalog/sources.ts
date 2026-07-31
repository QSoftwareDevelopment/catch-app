/**
 * Business-context sources — the raw material the assistant learns from.
 *
 * When a customer's call goes unanswered, Catch texts them back. For that reply to be
 * worth sending it has to know what the business actually offers, which is what these
 * uploads provide: a menu, a price sheet, a service list, a product label.
 *
 * Nothing here talks to a backend. Extraction and storage arrive with the catalog slice;
 * until then a source is captured, validated, and held so the flow can be reviewed.
 */

export type SourceKind = 'photo' | 'file' | 'text';

/**
 * Sources are captured but not yet processed. There is deliberately no 'ready' state —
 * claiming a document had been read when nothing has parsed it would be a lie the whole
 * feature rests on.
 */
export type SourceStatus = 'pending';

export type CatalogSource = {
  id: string;
  kind: SourceKind;
  /** Filename, or a generated label for a photo or pasted text. */
  name: string;
  sizeBytes: number | null;
  mimeType: string | null;
  /** Local device URI for photos and files. Absent for pasted text. */
  uri?: string;
  /** Full content for pasted text. Absent for photos and files. */
  text?: string;
  addedAt: string;
  status: SourceStatus;
};

export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

/** Extensions the extractor will be able to read. Shown verbatim in the UI. */
export const ACCEPTED_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'heic',
  'webp',
  'csv',
  'tsv',
  'json',
  'md',
  'txt',
] as const;

/** Passed to the document picker. Kept broad; the extension check is the real gate. */
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/*',
  'text/csv',
  'text/tab-separated-values',
  'application/json',
  'text/markdown',
  'text/plain',
] as const;

export function fileExtension(name: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(name.trim());
  return match ? match[1].toLowerCase() : '';
}

export function isAcceptedFileName(name: string): boolean {
  return (ACCEPTED_EXTENSIONS as readonly string[]).includes(fileExtension(name));
}

/**
 * Rejects a file before it is added, with a message aimed at a business owner rather
 * than at a developer. Returns null when the file is acceptable.
 */
export function validateFile(name: string, sizeBytes: number | null): string | null {
  if (!name.trim()) return 'That file has no name we can read. Try renaming it.';

  if (!isAcceptedFileName(name)) {
    const ext = fileExtension(name);
    return ext
      ? `We cannot read .${ext} files yet. Try a PDF, photo, spreadsheet, or text file.`
      : 'We cannot tell what kind of file that is. Try a PDF, photo, or text file.';
  }

  if (sizeBytes !== null && sizeBytes > MAX_SOURCE_BYTES) {
    return `That file is ${formatBytes(sizeBytes)}. The limit is ${formatBytes(
      MAX_SOURCE_BYTES,
    )} — try splitting it up.`;
  }

  if (sizeBytes === 0) return 'That file is empty.';

  return null;
}

export function validatePastedText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 'Paste or type something first';
  if (trimmed.length < 10) return 'That is too short to be useful — add more detail';
  if (trimmed.length > MAX_SOURCE_BYTES) return 'That is too long to handle in one go';
  return null;
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Secondary line under a source in the list. */
export function describeSource(source: CatalogSource): string {
  if (source.kind === 'text') {
    const chars = source.text?.trim().length ?? 0;
    return `Pasted text · ${chars.toLocaleString()} characters`;
  }
  const size = formatBytes(source.sizeBytes);
  const label = source.kind === 'photo' ? 'Photo' : fileExtension(source.name).toUpperCase();
  return size ? `${label} · ${size}` : label;
}

export function sourceIcon(kind: SourceKind): string {
  switch (kind) {
    case 'photo':
      return '🖼️';
    case 'text':
      return '📝';
    default:
      return '📄';
  }
}

let sequence = 0;

/** Unique within a session, which is all that is needed while nothing is persisted. */
export function nextSourceId(): string {
  sequence += 1;
  return `src_${Date.now().toString(36)}_${sequence}`;
}
