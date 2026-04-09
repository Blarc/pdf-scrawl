import type { ToolMode } from '../types';
import { Surface } from './ui/Surface';
import { Button } from './ui/Button';
import { Typography } from './ui/Typography';

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

async function hasPdfMagicBytes(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 4);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  } catch {
    return false;
  }
}

export function Toolbar({ mode, onModeChange, onUpload, fileName, hideUpload }: Props) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    <Surface
      level="bright"
      glass
      className={`
        flex flex-row items-center gap-2 px-4 py-2 shrink-0
        ${hideUpload 
          ? 'fixed left-4 top-1/2 -translate-y-1/2 flex-col w-12 rounded-full py-4 shadow-ambient z-10' 
          : 'relative border-b border-outline-variant border-opacity-10'
        }
      `}
    >
      {!hideUpload && (
        <label className="cursor-pointer">
          <Button variant="primary" size="sm" as="span">
            Upload PDF
          </Button>
          <input type="file" accept=".pdf" hidden onChange={handleFileChange} />
        </label>
      )}

      {fileName && !hideUpload && (
        <Typography 
          level="body" 
          className="text-on-surface opacity-60 max-w-[240px] truncate"
          title={fileName}
        >
          {fileName}
        </Typography>
      )}

      <div className={`flex ${hideUpload ? 'flex-col gap-3' : 'flex-row gap-1 ml-2'}`}>
        {TOOLS.map((tool) => (
          <Button
            key={tool.mode}
            title={tool.title}
            onClick={() => onModeChange(tool.mode)}
            variant={mode === tool.mode ? 'primary' : 'secondary'}
            size="sm"
            className={`
              ${hideUpload ? 'w-8 h-8 !p-0 rounded-full' : 'px-3.5'}
              ${mode === tool.mode ? 'shadow-sm' : ''}
            `}
          >
            {hideUpload ? tool.label.charAt(0) : tool.label}
          </Button>
        ))}
      </div>
    </Surface>
  );
}
