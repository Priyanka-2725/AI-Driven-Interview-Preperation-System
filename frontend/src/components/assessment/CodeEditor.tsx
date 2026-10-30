import React from 'react';
import Editor, { OnMount, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure @monaco-editor/react to use locally bundled monaco instance (offline / no CDN)
loader.config({ monaco });

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'python',
  readOnly = false,
  height = '480px',
  className = '',
}) => {
  const handleEditorMount: OnMount = (editor) => {
    editor.updateOptions({
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Menlo, Monaco, monospace",
      lineNumbers: 'on',
      roundedSelection: true,
      automaticLayout: true,
      renderLineHighlight: 'all',
      readOnly,
    });
  };

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-700/60 shadow-lg bg-[#1e1e1e] ${className}`}>
      <div className="bg-[#18181b] px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          <span className="text-xs font-mono text-slate-400 ms-2">
            solution.{language === 'python' ? 'py' : 'txt'}
          </span>
        </div>
        <div className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
          Python 3.10
        </div>
      </div>
      <Editor
        height={height}
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange?.(val || '')}
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        loading={
          <div className="flex items-center justify-center h-full text-slate-400 py-16 bg-[#1e1e1e]">
            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mr-2" />
            Loading code editor...
          </div>
        }
      />
    </div>
  );
};
