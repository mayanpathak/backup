import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, X, Bot, User, Loader2 } from 'lucide-react';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import { parseXml } from '../steps';
import { sendAIMessage, sendMessage, searchMessages as socketSearchMessages } from '../config/socket';
import axios from 'axios';
import { API_URL } from '../config/config.js';

// Syntax highlighter component for code blocks in messages
function SyntaxHighlightedCode(props) {
  const ref = useRef(null);

  React.useEffect(() => {
    if (ref.current && props.className?.includes('lang-') && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute('data-highlighted');
    }
  }, [props.className, props.children]);

  return <code {...props} ref={ref} />;
}

// Define types using JSDoc comments for better compatibility
/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} message
 * @property {Object} sender
 * @property {string} sender._id
 * @property {string} sender.email
 * @property {string} timestamp
 * @property {boolean} [isAI]
 */

/**
 * @typedef {Object} ChatInterfaceProps
 * @property {function} [onAIMessage]
 * @property {function} [onRegularMessage]
 * @property {ChatMessage[]} messages
 * @property {boolean} [loading]
 * @property {string} [projectId]
 */

export function ChatInterface({ 
  onAIMessage, 
  onRegularMessage, 
  messages = [], 
  loading = false,
  projectId,
  currentUser,
  searchResults = [],
  isSearching = false,
  isLoadingMore = false,
  totalMessageCount = 0,
  loadedMessageCount = 0,
  messageError = null,
  isSearchMode = false,
  onToggleSearchMode,
  onLoadMoreMessages
}) {
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messageBoxRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const isAICommand = message.trim().startsWith('@ai ');
    
    if (isAICommand) {
      const aiMessage = message.trim().substring(4); // Remove "@ai " prefix
      
      // Send AI message via socket with Redis storage
      if (projectId) {
        sendAIMessage(aiMessage, projectId);
      }
      
      // Also call the callback for local processing
      if (onAIMessage) {
        onAIMessage(aiMessage, []);
      }
    } else {
      // Send regular message via socket with Redis storage
      const messageData = {
        message: message.trim(),
        sender: currentUser || {
          _id: 'anonymous',
          email: 'Anonymous User'
        },
        projectId: projectId
      };
      
      if (projectId) {
        sendMessage('project-message', messageData);
      }
      
      // Also call the callback for local processing
      if (onRegularMessage) {
        onRegularMessage(message.trim());
      }
    }
    
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    // Use socket-based search with Redis for better performance
    if (projectId) {
      socketSearchMessages(projectId, searchTerm.trim());
    } else {
      // Fallback to local search
      const results = messages.filter(msg => 
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.sender.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }
  };

  const toggleSearchMode = () => {
    if (onToggleSearchMode) {
      onToggleSearchMode();
    }
    if (isSearchMode) {
      setSearchTerm('');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
           ' ' + date.toLocaleDateString();
  };

  const renderAIMessage = (messageContent) => {
    try {
      // Try to parse as JSON first (for AI responses with file structure)
      const parsedMessage = JSON.parse(messageContent);
      return (
        <div className='overflow-auto bg-gray-800 text-white rounded-md p-3 shadow-md border border-gray-700'>
          <Markdown
            children={parsedMessage.text || messageContent}
            options={{
              overrides: {
                code: SyntaxHighlightedCode,
              },
            }}
          />
        </div>
      );
    } catch {
      // If not JSON, render as markdown
      return (
        <div className='overflow-auto bg-gray-800 text-white rounded-md p-3 shadow-md border border-gray-700'>
          <Markdown
            children={messageContent}
            options={{
              overrides: {
                code: SyntaxHighlightedCode,
              },
            }}
          />
        </div>
      );
    }
  };

  const displayMessages = isSearchMode ? searchResults : messages;

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          Project Chat
        </h3>
        <button
          onClick={toggleSearchMode}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          title={isSearchMode ? 'Exit search' : 'Search messages'}
        >
          {isSearchMode ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {isSearchMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 border-b border-gray-800 bg-gray-900"
          >
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search messages..."
                  className="w-full p-2 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchTerm.trim() || isSearching}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {messageError && (
        <div className="bg-red-900/20 border border-red-700/40 text-red-300 p-3 m-3 rounded-md">
          <p className="text-sm font-medium flex items-center">
            <X className="w-4 h-4 mr-2" />
            {messageError}
          </p>
          <button 
            className="text-xs text-red-400 mt-1 hover:underline"
            onClick={() => {/* Handle error dismiss */}}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Load More Messages Button */}
      {!isSearchMode && loadedMessageCount < totalMessageCount && (
        <div className="flex justify-center p-2">
          <button
            onClick={onLoadMoreMessages}
            disabled={isLoadingMore}
            className="text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/30 p-2 px-4 rounded-md text-sm transition-colors flex items-center gap-1"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Load earlier messages ({totalMessageCount - loadedMessageCount} more)
              </>
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messageBoxRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            {isSearchMode && searchTerm ? (
              <>
                <Search className="w-12 h-12 opacity-40" />
                <p>No messages found matching "{searchTerm}"</p>
              </>
            ) : (
              <>
                <Bot className="w-12 h-12 opacity-40" />
                <p>Start chatting with your team</p>
                <p className="text-sm text-gray-500 text-center">
                  Use <span className="bg-gray-800 px-2 py-1 rounded text-blue-400">@ai</span> to get AI assistance
                </p>
              </>
            )}
          </div>
        ) : (
          displayMessages.map((msg, index) => (
            <motion.div
              key={msg.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col p-3 rounded-lg shadow-sm ${
                msg.sender._id === 'ai' 
                  ? 'bg-gray-800 border border-gray-700' 
                  : msg.sender._id === (currentUser && currentUser._id)
                    ? 'bg-blue-900 border border-blue-700 ml-8'
                    : 'bg-gray-700 border border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {msg.sender._id === 'ai' ? (
                  <Bot className="w-4 h-4 text-blue-400" />
                ) : (
                  <User className="w-4 h-4 text-gray-300" />
                )}
                <small className="text-xs font-medium text-gray-300">
                  {msg.sender._id === 'ai' ? 'AI Assistant' : msg.sender.email}
                </small>
                {msg.timestamp && (
                  <small className="text-xs text-gray-500 ml-auto">
                    {formatTimestamp(msg.timestamp)}
                  </small>
                )}
              </div>
              
              <div className="text-sm">
                {msg.sender._id === 'ai' ? (
                  renderAIMessage(msg.message)
                ) : (
                  <p className="text-gray-200 whitespace-pre-wrap">{msg.message}</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800 bg-gray-900">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isSearchMode ? 'Exit search mode to send messages' : 'Type your message... Use @ai for AI assistance'}
              disabled={isSearchMode || loading}
              className="w-full p-3 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none text-sm min-h-[44px] max-h-32"
              rows={1}
              style={{ 
                height: 'auto',
                minHeight: '44px'
              }}
              onInput={(e) => {
                const target = e.target;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            {message.startsWith('@ai ') && (
              <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                AI
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSearchMode || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center min-w-[44px]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* AI Command Help */}
        {message.startsWith('@ai') && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-2 bg-blue-900 border border-blue-700 rounded text-xs text-blue-200"
          >
            <p>🤖 AI Mode: Your message will be sent to AI for project assistance</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
