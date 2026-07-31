import {
  MAX_SOURCE_BYTES,
  describeSource,
  fileExtension,
  formatBytes,
  isAcceptedFileName,
  nextSourceId,
  validateFile,
  validatePastedText,
  type CatalogSource,
} from './sources';

describe('fileExtension', () => {
  it('reads the extension regardless of case or dots in the name', () => {
    expect(fileExtension('menu.PDF')).toBe('pdf');
    expect(fileExtension('spring.menu.v2.csv')).toBe('csv');
    expect(fileExtension('  prices.txt  ')).toBe('txt');
  });

  it('returns empty for a name with no extension', () => {
    expect(fileExtension('scan')).toBe('');
    expect(fileExtension('')).toBe('');
  });
});

describe('isAcceptedFileName', () => {
  it('accepts the formats the extractor will handle', () => {
    for (const name of ['a.pdf', 'a.png', 'a.jpg', 'a.heic', 'a.csv', 'a.json', 'a.md']) {
      expect(isAcceptedFileName(name)).toBe(true);
    }
  });

  it('rejects formats we cannot read', () => {
    // .docx and .xlsx are the ones owners will actually try, so they must fail cleanly
    // rather than upload and silently produce nothing.
    for (const name of ['a.docx', 'a.xlsx', 'a.pages', 'a.zip', 'a.mp4']) {
      expect(isAcceptedFileName(name)).toBe(false);
    }
  });
});

describe('validateFile', () => {
  it('accepts a normal file', () => {
    expect(validateFile('spring-menu.pdf', 240_000)).toBeNull();
  });

  it('names the offending format so the owner knows what to do', () => {
    expect(validateFile('prices.docx', 1000)).toMatch(/\.docx/);
  });

  it('rejects a file over the size limit and states both numbers', () => {
    const message = validateFile('huge.pdf', MAX_SOURCE_BYTES + 1);
    expect(message).toMatch(/10\.0 MB/);
  });

  it('accepts a file exactly at the limit', () => {
    // Off-by-one here would reject a file the copy promises is allowed.
    expect(validateFile('edge.pdf', MAX_SOURCE_BYTES)).toBeNull();
  });

  it('rejects an empty file', () => {
    expect(validateFile('empty.pdf', 0)).toBe('That file is empty.');
  });

  it('accepts an unknown size, since some pickers do not report one', () => {
    expect(validateFile('menu.pdf', null)).toBeNull();
  });

  it('rejects a nameless file', () => {
    expect(validateFile('   ', 100)).not.toBeNull();
  });
});

describe('validatePastedText', () => {
  it('accepts a realistic price list', () => {
    expect(validatePastedText('Furnace tune-up — $149\nAC install — from $3,200')).toBeNull();
  });

  it('rejects empty or whitespace-only input', () => {
    expect(validatePastedText('')).toBe('Paste or type something first');
    expect(validatePastedText('    \n  ')).toBe('Paste or type something first');
  });

  it('rejects input too short to be useful', () => {
    expect(validatePastedText('hi')).toMatch(/too short/);
  });
});

describe('formatBytes', () => {
  it('scales the unit to the size', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('renders nothing for an unknown size', () => {
    expect(formatBytes(null)).toBe('');
  });
});

describe('describeSource', () => {
  const base = { id: 'x', addedAt: '', status: 'pending' } as const;

  it('describes a file by format and size', () => {
    expect(
      describeSource({ ...base, kind: 'file', name: 'menu.pdf', sizeBytes: 2048, mimeType: null }),
    ).toBe('PDF · 2 KB');
  });

  it('describes pasted text by length', () => {
    const source: CatalogSource = {
      ...base,
      kind: 'text',
      name: 'Prices',
      sizeBytes: null,
      mimeType: 'text/plain',
      text: 'a'.repeat(1500),
    };
    expect(describeSource(source)).toBe('Pasted text · 1,500 characters');
  });
});

describe('nextSourceId', () => {
  it('never repeats within a session', () => {
    // Two files picked in the same millisecond would otherwise collide and React would
    // render one row for both.
    const ids = new Set(Array.from({ length: 200 }, () => nextSourceId()));
    expect(ids.size).toBe(200);
  });
});
