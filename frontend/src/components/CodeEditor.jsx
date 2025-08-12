


import Editor from '@monaco-editor/react';
import { FileItem } from '../types';
import { FileCode, Sparkles, Code2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeEditorProps {
  file: FileItem | null;
  onUpdateFile?: (updatedFile: FileItem) => void;
}

// Determine language from file extension
function getLanguage(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

export function CodeEditor({ file, onUpdateFile }: CodeEditorProps) {
  const [editorContent, setEditorContent] = useState<string>(file?.content || '');

  // Update editor content when file changes
  useEffect(() => {
    if (file) {
      setEditorContent(file.content || '');
    }
  }, [file]);

  const handleEditorChange = (value: string | undefined) => {
    if (!file || !value) return;
    
    setEditorContent(value);
    
    if (onUpdateFile) {
      onUpdateFile({
        ...file,
        content: value
      });
    }
  };

  const emptyStateVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
        staggerChildren: 0.1
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  const editorVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" as const }
    }
  };

  if (!file) {
    return (
      <motion.div 
        className="h-full flex flex-col items-center justify-center p-8 text-center relative overflow-hidden"
        variants={emptyStateVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              top: `${20 + i * 10}%`,
              left: `${15 + i * 8}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut" as const,
            }}
          />
        ))}

        <motion.div variants={childVariants}>
          <motion.div 
            className="relative w-20 h-20 mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            >
              <FileCode className="w-10 h-10 text-blue-400" />
            </motion.div>
            
            {/* Animated ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-blue-400/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={childVariants}>
          <motion.h3 
            className="text-xl font-semibold mb-3"
            style={{
              background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ready to Code
          </motion.h3>
        </motion.div>

        <motion.div variants={childVariants}>
          <p className="text-gray-400 max-w-md leading-relaxed">
            Select a file from the explorer to start editing. Your code will be highlighted with intelligent syntax coloring and auto-completion.
          </p>
        </motion.div>

        <motion.div 
          variants={childVariants}
          className="mt-6 flex items-center gap-2 text-sm text-gray-500"
        >
          <Code2 className="w-4 h-4" />
          <span>Powered by Monaco Editor</span>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="h-full relative"
        variants={editorVariants}
        initial="hidden"
        animate="visible"
        key={file.path}
      >
        {/* Premium Header Bar */}
        <motion.div 
          className="absolute top-0 left-0 right-0 z-10 px-6 py-3 flex items-center"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.1)',
          }}
          variants={headerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {/* File type indicator */}
            <motion.div
              className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            />
            
            <motion.span 
              className="text-sm font-mono"
              style={{
                background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {file.path}
            </motion.span>
          </motion.div>

          {/* Language badge */}
          <motion.div
            className="ml-auto px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {getLanguage(file.name)}
          </motion.div>
        </motion.div>

        {/* Editor Container */}
        <motion.div 
          className="pt-16 h-full relative"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Subtle glow effect */}
          <motion.div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            }}
            animate={{
              background: [
                'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut" as const,
            }}
          />

          <Editor
            height="100%"
            defaultLanguage={getLanguage(file.name)}
            theme="vs-dark"
            value={editorContent}
            onChange={handleEditorChange}
            options={{
              readOnly: false,
              minimap: { enabled: true },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Fira Code, Monaco, monospace',
              fontLigatures: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              renderLineHighlight: 'all',
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              quickSuggestions: false,
              parameterHints: { enabled: false },
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              padding: { top: 20, bottom: 20 },
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
            onMount={(editor, monaco) => {
              // Disable validation for TypeScript/JavaScript
              if (monaco.languages.typescript) {
                monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                  noSemanticValidation: true,
                  noSyntaxValidation: true
                });
                
                monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                  noSemanticValidation: true,
                  noSyntaxValidation: true
                });
              }
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}