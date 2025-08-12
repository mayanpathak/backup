

import { useState, memo } from 'react';
import { FolderTree, File, ChevronRight, ChevronDown, FileCode, FileJson, FileText, Folder } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function getFileIcon(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-emerald-400" />;
    case 'md':
      return <FileText className="w-4 h-4 text-blue-300" />;
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-400" />;
    case 'css':
    case 'scss':
      return <FileCode className="w-4 h-4 text-purple-400" />;
    case 'py':
      return <FileCode className="w-4 h-4 text-green-400" />;
    case 'java':
      return <FileCode className="w-4 h-4 text-red-400" />;
    default:
      return <File className="w-4 h-4 text-slate-400" />;
  }
}

function getFileTypeLabel(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js': return 'JS';
    case 'jsx': return 'JSX';
    case 'ts': return 'TS';
    case 'tsx': return 'TSX';
    case 'json': return 'JSON';
    case 'md': return 'MD';
    case 'html': return 'HTML';
    case 'css': return 'CSS';
    case 'scss': return 'SCSS';
    case 'py': return 'PY';
    case 'java': return 'JAVA';
    default: return extension?.toUpperCase() || '';
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

const FileNode = memo(({ item, depth, onFileClick, selectedPath, index }) => {
  const [isExpanded, setIsExpanded] = useState(item.type === 'folder');
  const isSelected = selectedPath === item.path;
  const fileTypeLabel = item.type === 'file' ? getFileTypeLabel(item.name) : '';

  const handleClick = () => {
    if (item.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick(item);
    }
  };

  return (
    <div 
      className="select-none animate-in slide-in-from-left-5 fade-in duration-300"
      style={{ 
        animationDelay: `${index * 50}ms`
      }}
    >
      <div
        className={cn(
          "group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 text-sm",
          "hover:bg-white/5 hover:backdrop-blur-sm hover:shadow-sm hover:scale-[1.02] hover:translate-x-1",
          isSelected && "bg-indigo-500/20 border-l-2 border-indigo-400 shadow-md",
          item.type === 'folder' ? "font-medium" : "font-normal"
        )}
        style={{ 
          paddingLeft: `${depth * 1 + 0.75}rem`,
          marginLeft: `${depth * 0.25}rem`
        }}
        onClick={handleClick}
        role={item.type === 'folder' ? 'button' : 'option'}
        aria-expanded={item.type === 'folder' ? isExpanded : undefined}
        aria-selected={isSelected}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {item.type === 'folder' && (
          <span className={cn(
            "text-slate-400 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
        
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {item.type === 'folder' ? (
            <Folder className={cn(
              "w-4 h-4 transition-colors duration-200",
              isExpanded ? "text-indigo-400" : "text-slate-400"
            )} />
          ) : (
            getFileIcon(item.name)
          )}
          
          <span className={cn(
            "truncate transition-colors duration-200",
            item.type === 'folder' 
              ? "text-slate-200 group-hover:text-white" 
              : "text-slate-300 group-hover:text-slate-100"
          )}>
            {item.name}
          </span>
        </div>

        {item.type === 'file' && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {fileTypeLabel && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 font-mono">
                {fileTypeLabel}
              </span>
            )}
            {item.size && (
              <span className="text-xs text-slate-500 font-mono">
                {formatFileSize(item.size)}
              </span>
            )}
          </div>
        )}
      </div>
      
      {item.type === 'folder' && item.children && (
        <div 
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          )}
          style={{
            transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)'
          }}
        >
          <div className="mt-1">
            {item.children
              .sort((a, b) => {
                if (a.type === 'folder' && b.type === 'file') return -1;
                if (a.type === 'file' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
              })
              .map((child, childIndex) => (
                <FileNode
                  key={`${child.path}-${childIndex}`}
                  item={child}
                  depth={depth + 1}
                  onFileClick={onFileClick}
                  selectedPath={selectedPath}
                  index={childIndex}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
});

FileNode.displayName = 'FileNode';

export function WilderFileExplorer({ files, onFileSelect, selectedPath }) {
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="h-full flex flex-col">
      {/* Wilder Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 backdrop-blur-sm bg-slate-900/50">
        <FolderTree className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
          Wilder Project Files
        </h3>
      </div>

      {/* File Tree Container with Glassmorphism */}
      <div className="flex-1 overflow-auto p-2 backdrop-blur-sm bg-gradient-to-br from-slate-900/30 to-slate-800/20">
        <div 
          className="space-y-1 rounded-xl p-2 bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl"
          role="tree"
          aria-label="Wilder project files"
        >
          {sortedFiles.map((file, index) => (
            <FileNode
              key={`${file.path}-${index}`}
              item={file}
              depth={0}
              onFileClick={onFileSelect}
              selectedPath={selectedPath}
              index={index}
            />
          ))}
          {sortedFiles.length === 0 && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
                <FolderTree className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">No files yet</p>
              <p className="text-slate-500 text-xs">
                Your Wilder project files will appear here
              </p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}

// Demo component with sample data
export default function WilderFileExplorerDemo() {
  const [selectedPath, setSelectedPath] = useState('');

  const sampleFiles = [
    {
      name: 'src',
      path: '/src',
      type: 'folder',
      children: [
        {
          name: 'components',
          path: '/src/components',
          type: 'folder',
          children: [
            { name: 'Header.tsx', path: '/src/components/Header.tsx', type: 'file', size: 2048 },
            { name: 'Footer.jsx', path: '/src/components/Footer.jsx', type: 'file', size: 1536 },
            { name: 'Button.tsx', path: '/src/components/Button.tsx', type: 'file', size: 1024 }
          ]
        },
        { name: 'App.tsx', path: '/src/App.tsx', type: 'file', size: 4096 },
        { name: 'index.css', path: '/src/index.css', type: 'file', size: 2560 },
        { name: 'main.tsx', path: '/src/main.tsx', type: 'file', size: 512 }
      ]
    },
    {
      name: 'public',
      path: '/public',
      type: 'folder',
      children: [
        { name: 'index.html', path: '/public/index.html', type: 'file', size: 1024 },
        { name: 'favicon.ico', path: '/public/favicon.ico', type: 'file', size: 256 }
      ]
    },
    { name: 'package.json', path: '/package.json', type: 'file', size: 1536 },
    { name: 'README.md', path: '/README.md', type: 'file', size: 2048 },
    { name: 'tsconfig.json', path: '/tsconfig.json', type: 'file', size: 512 }
  ];

  const handleFileSelect = (file) => {
    setSelectedPath(file.path);
    console.log('Selected file:', file);
  };

  return (
    <div className="w-80 h-96 bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
      <WilderFileExplorer 
        files={sampleFiles} 
        onFileSelect={handleFileSelect}
        selectedPath={selectedPath}
      />
    </div>
  );
}