import type { ToolMode } from '../types';

interface Props {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  onUpload: (file: File) => void;
  fileName: string | null;
  /** Hide the Upload PDF button (used when already inside a room). */
  hideUpload?: boolean;
}

const TOOLS: Array<{ mode: ToolMode; label: string; title: string }> = [
  { mode: 'select', label: 'Select', title: 'Select and click annotations' },
  { mode: 'rect', label: 'Rectangle', title: 'Draw a rectangle annotation' },
  { mode: 'freehand', label: 'Pen', title: 'Draw freehand annotation' },
  { mode: 'eraser', label: 'Eraser', title: 'Delete an annotation by clicking it' },
];

/**
 * Read the first 4 bytes from a File and check for the PDF magic bytes %PDF.
 * This is a client-side sanity check only — it is not a substitute for
 * server-side validation, but it catches mislabelled files before handing
 * them to pdfjs-dist for parsing.
 */
async function hasPdfMagicBytes(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 4);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // %PDF = 0x25 0x50 0x44 0x46
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  } catch {
    return false;
  }
}

export function Toolbar({ mode, onModeChange, onUpload, fileName, hideUpload }: Props) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected after a rejection
    e.target.value = '';

    if (!file) return;

    const valid = await hasPdfMagicBytes(file);
    if (!valid) {
      alert('The selected file does not appear to be a valid PDF.');
      return;
    }

    onUpload(file);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderBottom: '1px solid #ddd',
        background: '#fafafa',
        flexShrink: 0,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {!hideUpload && (
        <label
          style={{
            cursor: 'pointer',
            padding: '5px 14px',
            background: '#333',
            color: '#fff',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 500,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Upload PDF
          <input type="file" accept=".pdf" hidden onChange={handleFileChange} />
        </label>
      )}

      {fileName && (
        <span
          style={{
            fontSize: 13,
            color: '#555',
            maxWidth: 240,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={fileName}
        >
          {fileName}
        </span>
      )}

      <div style={{ display: 'flex', gap: 4, marginLeft: fileName ? 8 : 0 }}>
        {TOOLS.map((tool) => (
          <button
            key={tool.mode}
            title={tool.title}
            onClick={() => onModeChange(tool.mode)}
            style={{
              padding: '5px 14px',
              background: mode === tool.mode ? '#0066cc' : '#eee',
              color: mode === tool.mode ? '#fff' : '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: mode === tool.mode ? 600 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  );
}
