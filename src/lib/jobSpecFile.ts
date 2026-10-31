// Reads a job spec file in the browser and returns its plain text, so the
// candidate can upload the posting instead of copying and pasting it.
// Supports PDF, Word (.docx), and plain text (.txt / .md).

export const JOB_SPEC_ACCEPT =
  '.pdf,.docx,.txt,.md,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const JOB_SPEC_MAX_BYTES = 5 * 1024 * 1024;

export class JobSpecReadError extends Error {}

type Kind = 'pdf' | 'docx' | 'text';

function kindOf(file: File): Kind | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/'))
    return 'text';
  return null;
}

/** Tidy whitespace so the text area shows something readable. */
function tidy(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function readPdf(file: File): Promise<string> {
  // Loaded only when someone uploads a PDF job spec, to keep the page light.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const workerUrl = (await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= Math.min(doc.numPages, 20); p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    let out = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      out += item.str;
      out += item.hasEOL ? '\n' : ' ';
    }
    pages.push(out);
  }
  await doc.destroy();
  // PDFs break lines mid-sentence; join a line onto the previous one when it
  // clearly carries on (previous line has no end punctuation, next is lowercase).
  return pages
    .join('\n\n')
    .replace(/([^.:;!?\n])[ \t]*\n[ \t]*(?=[a-z(])/g, '$1 ');
}

// A .docx is a zip; the text lives in word/document.xml.
async function readDocx(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(buf.buffer);

  // Find the end-of-central-directory record.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new JobSpecReadError('This Word file looks damaged.');

  const count = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const name = decoder.decode(buf.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;
    if (name !== 'word/document.xml') continue;

    const lNameLen = view.getUint16(localOffset + 26, true);
    const lExtraLen = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);

    let xmlBytes: Uint8Array;
    if (method === 0) {
      xmlBytes = raw;
    } else if (method === 8 && typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      xmlBytes = new Uint8Array(await new Response(stream).arrayBuffer());
    } else {
      throw new JobSpecReadError(
        'This browser cannot open Word files. Save it as a PDF or paste the text instead.'
      );
    }

    const xml = decoder.decode(xmlBytes);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const paragraphs = Array.from(doc.getElementsByTagNameNS('*', 'p'));
    return paragraphs
      .map((p) =>
        Array.from(p.getElementsByTagNameNS('*', 't'))
          .map((t) => t.textContent ?? '')
          .join('')
      )
      .join('\n');
  }
  throw new JobSpecReadError('We could not find any text in this Word file.');
}

/** Returns the job spec text, or throws JobSpecReadError with a friendly message. */
export async function readJobSpecFile(file: File): Promise<string> {
  const kind = kindOf(file);
  if (!kind) {
    throw new JobSpecReadError('Please upload a PDF, Word (.docx) or text file.');
  }
  if (file.size > JOB_SPEC_MAX_BYTES) {
    throw new JobSpecReadError('Job spec files must be 5 MB or smaller.');
  }
  let text: string;
  try {
    text =
      kind === 'pdf' ? await readPdf(file) : kind === 'docx' ? await readDocx(file) : await file.text();
  } catch (err) {
    if (err instanceof JobSpecReadError) throw err;
    throw new JobSpecReadError(
      'We could not read that file. Try another copy, or paste the text instead.'
    );
  }
  return tidy(text);
}
