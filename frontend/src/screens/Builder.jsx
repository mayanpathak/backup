import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChatInterface } from '../components/ChatInterface';
// import { FileExplorer } from '../components/FileExplorer';
import { WilderFileExplorer as FileExplorer } from '../components/FileExplorer';
import { TabView } from '../components/TabView';
import { CodeEditor } from '../components/CodeEditor';
import { PreviewFrame } from '../components/PreviewFrame';
import { Step, FileItem, StepType } from '../types/index';
import axios from 'axios';
import { API_URL } from '../config/config.js';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { Loader } from '../components/Loader';
import { useUser } from '../context/user.context';
import { 
  initializeSocket, 
  sendMessage, 
  receiveMessage, 
  removeMessageHandler,
  loadCachedMessages,
  sendAIMessage,
  SOCKET_EVENTS 
} from '../config/socket';

import {
  Home,
  PanelRight,
  Send,
  RefreshCw,
  AlertTriangle,
  BoltIcon,
  Download,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { WebContainer } from '@webcontainer/api';
import { downloadProjectAsZip } from '../utils/fileDownloader';
import { useAppContext } from '../context/AppContext';

// Defining the step status type explicitly (using JSDoc)
/** @type {'pending' | 'in-progress' | 'completed'} */

export function Builder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const {
    prompt,
    setLoading: setContextLoading,
    currentStep,
    setCurrentStep,
  } = useAppContext();
  const [userPrompt, setPrompt] = useState('');
  const [llmMessages, setLlmMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const {
    webcontainer,
    error: webContainerError,
    loading: webContainerLoading,
  } = useWebContainer();

  // Get project data from location state or use defaults
  const project = location.state?.project;
  const projectId = project?._id || 'default-project-' + Date.now();
  const projectName = project?.name || 'Untitled Project';
  
  // Chat related state
  const [chatMessages, setChatMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  
  // Additional states from Project.jsx
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalMessageCount, setTotalMessageCount] = useState(0);
  const [loadedMessageCount, setLoadedMessageCount] = useState(0);
  const [messageError, setMessageError] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [activeTab, setActiveTab] = useState('code');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFileExplorerCollapsed, setFileExplorerCollapsed] = useState(false);

  const [steps, setSteps] = useState([]);
  const [files, setFiles] = useState([]);

  // Helper function to convert file tree object to array format
  const convertFileTreeToArray = (fileTree) => {
    const result = [];
    
    const processItem = (key, value, parentPath = '') => {
      const currentPath = parentPath ? `${parentPath}/${key}` : key;
      
      if (value.file) {
        // It's a file
        result.push({
          name: key,
          path: currentPath,
          type: 'file',
          content: value.file.contents || ''
        });
      } else if (value.directory) {
        // It's a directory
        const children = [];
        Object.entries(value.directory).forEach(([childKey, childValue]) => {
          const childItems = processItem(childKey, childValue, currentPath);
          if (Array.isArray(childItems)) {
            children.push(...childItems);
          } else {
            children.push(childItems);
          }
        });
        
        result.push({
          name: key,
          path: currentPath,
          type: 'folder',
          children: children
        });
      }
    };
    
    Object.entries(fileTree).forEach(([key, value]) => {
      processItem(key, value);
    });
    
    return result;
  };

  // Socket initialization and cleanup - Enhanced with full Project.jsx functionality
  useEffect(() => {
    const socketInstance = initializeSocket(projectId);
    setSocket(socketInstance);

    // Set up comprehensive message handlers
    receiveMessage(SOCKET_EVENTS.LOAD_MESSAGES, (data) => {
      console.log("Loading cached messages:", data);
      if (data.messages && Array.isArray(data.messages)) {
        setChatMessages(data.messages);
        setLoadedMessageCount(data.messages.length);
        setTotalMessageCount(data.totalCount || data.messages.length);
      }
    });

    receiveMessage(SOCKET_EVENTS.SEARCH_RESULTS, (results) => {
      console.log("Search results:", results);
      setSearchResults(results || []);
      setIsSearching(false);
    });

    receiveMessage(SOCKET_EVENTS.MORE_MESSAGES_LOADED, (olderMessages) => {
      console.log("Loaded more messages:", olderMessages);
      if (Array.isArray(olderMessages) && olderMessages.length > 0) {
        setChatMessages(prevMessages => [...olderMessages, ...prevMessages]);
        setLoadedMessageCount(prev => prev + olderMessages.length);
      }
      setIsLoadingMore(false);
    });

    receiveMessage(SOCKET_EVENTS.ERROR, (error) => {
      console.error("Socket error:", error);
      setMessageError(error.message || "An unknown error occurred");
      setIsSearching(false);
      setIsLoadingMore(false);
    });

    receiveMessage(SOCKET_EVENTS.PROJECT_MESSAGE, (data) => {
      console.log("Received message:", data);
      
      if (data.sender._id !== (user && user._id)) {
        // Handle AI messages with file tree updates
        if (data.sender._id === 'ai') {
          try {
            const message = JSON.parse(data.message);
            console.log("AI message:", message);

            if (webcontainer && message.fileTree) {
              webcontainer.mount(message.fileTree);
              setFiles(convertFileTreeToArray(message.fileTree));
            }
          } catch (error) {
            console.error("Error parsing AI message:", error);
          }
        }
        
        setChatMessages(prevMessages => [...prevMessages, data]);
        setLoadedMessageCount(prev => prev + 1);
      }
    });

    receiveMessage(SOCKET_EVENTS.PROJECT_UPDATE, (updatedProject) => {
      console.log('Project updated:', updatedProject);
      // Handle project updates if needed
    });

    // Load cached messages on initialization
    loadCachedMessages(projectId);

    return () => {
      // Cleanup socket event listeners
      const events = [
        SOCKET_EVENTS.LOAD_MESSAGES,
        SOCKET_EVENTS.SEARCH_RESULTS,
        SOCKET_EVENTS.MORE_MESSAGES_LOADED,
        SOCKET_EVENTS.ERROR,
        SOCKET_EVENTS.PROJECT_MESSAGE,
        SOCKET_EVENTS.PROJECT_UPDATE
      ];
      
      events.forEach(event => {
        removeMessageHandler(event);
      });
      
      // Cleanup socket connection
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [projectId, user, webcontainer]);

  // Handle AI messages and file generation
  const handleAIMessage = async (message, steps) => {
    setLoading(true);
    
    try {
      // Add user message to chat
      const userMessage = {
        id: Date.now().toString(),
        message: `@ai ${message}`,
        sender: {
          _id: user && user._id || 'current-user',
          email: user && user.email || 'You'
        },
        timestamp: new Date().toISOString(),
        isAI: false
      };
      
      setChatMessages(prev => [...prev, userMessage]);

      // Send to AI API
      const response = await axios.post(`${API_URL}/chat`, {
        messages: [
          ...llmMessages,
          { role: 'user', content: message }
        ],
      });

      // Process AI response and extract steps
      const aiResponse = response.data.response;
      const newSteps = parseXml(aiResponse).map((x) => ({
        ...x,
        status: 'pending',
      }));

      // Add AI message to chat
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        message: aiResponse,
        sender: {
          _id: 'ai',
          email: 'AI Assistant'
        },
        timestamp: new Date().toISOString(),
        isAI: true
      };
      
      setChatMessages(prev => [...prev, aiMessage]);

      // Update LLM messages
      setLlmMessages(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: aiResponse }
      ]);

      // Add new steps for file generation
      if (newSteps.length > 0) {
        setSteps(prevSteps => [...prevSteps, ...newSteps]);
      }

      // Broadcast message to other collaborators via socket
      if (socket) {
        sendMessage('project-message', aiMessage);
      }

    } catch (error) {
      console.error('Error sending AI message:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 2).toString(),
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: {
          _id: 'ai',
          email: 'AI Assistant'
        },
        timestamp: new Date().toISOString(),
        isAI: true
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle regular chat messages
  const handleRegularMessage = (message) => {
    const userMessage = {
      id: Date.now().toString(),
      message,
      sender: {
        _id: user && user._id || 'current-user',
        email: user && user.email || 'You'
      },
      timestamp: new Date().toISOString(),
      isAI: false
    };
    
    setChatMessages(prev => [...prev, userMessage]);

    // Broadcast message to other collaborators via socket
    if (socket) {
      sendMessage('project-message', userMessage);
    }
  };

  // Process steps to generate files
  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;

    steps
      .filter(({ status }) => status === 'pending')
      .forEach((step) => {
        updateHappened = true;
        if (step?.type === StepType.CreateFile) {
          let parsedPath = step.path?.split('/') ?? []; // ["src", "components", "App.tsx"]
          let currentFileStructure = [...originalFiles]; // {}
          let finalAnswerRef = currentFileStructure;

          let currentFolder = '';
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              // final file
              let file = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'file',
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              /// in a folder
              let folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
                // create the folder
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'folder',
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder
              ).children;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
          steps.map((s) => {
          return {
            ...s,
              status: 'completed',
          };
        })
      );
    }
  }, [steps]);

  // Update WebContainer when files change
  useEffect(() => {
    if (!webcontainer || files.length === 0) return;

    try {
      webcontainer.mount(createMountStructure(files));
    } catch (err) {
      console.error('Error mounting files to WebContainer:', err);
    }
  }, [files, webcontainer]);

  const handleFileUpdate = (updatedFile) => {
    // Deep clone files to maintain immutability
    const updateFilesRecursively = (
      filesArray,
      fileToUpdate
    ) => {
      return filesArray.map((file) => {
        if (file.path === fileToUpdate.path) {
          return fileToUpdate;
        } else if (file.type === 'folder' && file.children) {
          return {
            ...file,
            children: updateFilesRecursively(file.children, fileToUpdate),
          };
        }
        return file;
      });
    };

    const updatedFiles = updateFilesRecursively(files, updatedFile);
    setFiles(updatedFiles);

    // Update file in WebContainer if it's initialized
    if (webcontainer) {
      try {
        webcontainer.fs.writeFile(
          updatedFile.path.startsWith('/')
            ? updatedFile.path.substring(1)
            : updatedFile.path,
          updatedFile.content || ''
        );
      } catch (err) {
        console.error('Error writing file to WebContainer:', err);
      }
    }
  };

  // Create mount structure for WebContainer
  const createMountStructure = (files) => {
    const mountStructure = {};

    const processFile = (file, isRootFolder) => {
      if (file.type === 'folder') {
        // For folders, create a directory entry
        mountStructure[file.name] = {
          directory: file.children
            ? Object.fromEntries(
                file.children.map((child) => [
                  child.name,
                  processFile(child, false),
                ])
              )
            : {},
        };
      } else if (file.type === 'file') {
        if (isRootFolder) {
          mountStructure[file.name] = {
            file: {
              contents: file.content || '',
            },
          };
        } else {
          // For files, create a file entry with contents
          return {
            file: {
              contents: file.content || '',
            },
          };
        }
      }

      return mountStructure[file.name];
    };

    // Process each top-level file/folder
    files.forEach((file) => processFile(file, true));

    return mountStructure;
  };

  async function init() {
    try {
      setLoading(true);

      // Skip if template is already set
      if (!templateSet) {
        // Get template from backend
        const response = await axios.post(`${API_URL}/template`, {
          prompt,
        });

        const { prompts, uiPrompts } = response.data;

        setLlmMessages([
          {
            role: 'user',
            content: prompt,
          },
        ]);

        // Set the initial steps from template
        const initialSteps = parseXml(uiPrompts[0] || '').map((x) => ({
          ...x,
          status: 'pending',
        }));

        setSteps(initialSteps);
        setTemplateSet(true);

        // Send the chat request for full project generation
        const chatResponse = await axios.post(`${API_URL}/chat`, {
          messages: [...prompts, prompt].map((content) => ({
            role: 'user',
            content,
          })),
        });

        // Process the steps from the chat response
        const newSteps = parseXml(chatResponse.data.response).map((x) => ({
          ...x,
          status: 'pending',
        }));

        setSteps((prevSteps) => [...prevSteps, ...newSteps]);

        setLlmMessages((prevMessages) => [
          ...prevMessages,
          { role: 'assistant', content: chatResponse.data.response },
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing project:', error);
      setLoading(false);
    }
  }

  const handleRefreshWebContainer = () => {
    window.location.href = '/';
  };

  const handleDownloadProject = async () => {
    if (files.length > 0) {
      setIsDownloading(true);
      try {
        await downloadProjectAsZip(files);
      } catch (error) {
        console.error('Failed to download project:', error);
      } finally {
        setIsDownloading(false);
      }
    }
  };



  useEffect(() => {
    if (webcontainer && !templateSet) {
      init();
    }
  }, [webcontainer, templateSet]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
            <img 
              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTMgMkwzIDEzTDEyIDEzTDExIDIyTDIxIDExTDEyIDExTDEzIDJaIiBzdHJva2U9IiM2MEE1RkEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiAvPjwvc3ZnPg==" 
              alt="Bolt Logo" 
              className="w-6 h-6 relative z-10" 
            />
            <h1 className="text-xl font-semibold text-white">Wilder</h1>
            </button>
          <div className="h-6 mx-4 border-r border-gray-700"></div>
          <h2 className="text-gray-300 hidden sm:block">{projectName}</h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownloadProject}
            disabled={isDownloading || files.length === 0}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mr-4 bg-gray-800 px-3 py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download project as ZIP"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download ZIP</span>
              </>
            )}
          </button>
          <a
            href="/"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">Home</span>
          </a>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <motion.div
          className="bg-gray-900 border-r border-gray-800 overflow-hidden"
          animate={{
            width: isSidebarCollapsed
              ? '3rem'
              : ['100%', '90%', '75%', '50%', '33%', '25rem'].length >
                window.innerWidth / 100
              ? '0'
              : '25rem',
          }}
          initial={false}
          transition={{ duration: 0.3 }}
        >
          <div className="flex h-full">
            {/* Collapse button */}
            <div className="p-2 bg-gray-900 border-r border-gray-800 flex flex-col items-center">
              <button
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                title={
                  isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                }
              >
                <PanelRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isSidebarCollapsed ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {!isSidebarCollapsed && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="border-b border-gray-800 p-4">
                  <h3 className="text-white font-medium mb-1">Your Prompt</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{prompt}</p>
                </div>

                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    messages={chatMessages}
                    onAIMessage={handleAIMessage}
                    onRegularMessage={handleRegularMessage}
                    loading={loading}
                    projectId={projectId}
                    currentUser={user}
                    searchResults={searchResults}
                    isSearching={isSearching}
                    isLoadingMore={isLoadingMore}
                    totalMessageCount={totalMessageCount}
                    loadedMessageCount={loadedMessageCount}
                    messageError={messageError}
                    isSearchMode={isSearchMode}
                    onToggleSearchMode={() => setIsSearchMode(!isSearchMode)}
                    onLoadMoreMessages={() => {
                      if (isLoadingMore || loadedMessageCount >= totalMessageCount) return;
                      setIsLoadingMore(true);
                      sendMessage('load-more-messages', { 
                        projectId,
                        offset: loadedMessageCount, 
                        limit: 20 
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* File explorer */}
        <motion.div
          className="border-r border-gray-800 bg-gray-900 overflow-hidden flex flex-col"
          animate={{
            width: isFileExplorerCollapsed ? '0' : '16rem',
            opacity: isFileExplorerCollapsed ? 0 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white font-medium">Files</h3>
            <button
              onClick={() => setFileExplorerCollapsed(!isFileExplorerCollapsed)}
              className="p-1 rounded-lg hover:bg-gray-800 transition-colors md:hidden"
            >
              <PanelRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <FileExplorer files={files} onFileSelect={setSelectedFile} />
          </div>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="flex items-center md:hidden">
              <button
                onClick={() =>
                  setFileExplorerCollapsed(!isFileExplorerCollapsed)
                }
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                title={isFileExplorerCollapsed ? 'Show files' : 'Hide files'}
              >
                <PanelRight
                  className={`w-4 h-4 text-gray-400 ${
                    isFileExplorerCollapsed ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <button
                onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                className="ml-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                <PanelRight
                  className={`w-4 h-4 text-gray-400 ${
                    !isSidebarCollapsed ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-4 bg-gray-950">
            <div className="h-full rounded-lg overflow-hidden border border-gray-800 bg-gray-900 shadow-xl">
              {activeTab === 'code' ? (
                <CodeEditor
                  file={selectedFile}
                  onUpdateFile={handleFileUpdate}
                />
              ) : webcontainer ? (
                <PreviewFrame
                  webContainer={webcontainer}
                  files={files}
                />
              ) : webContainerLoading ? (
                <div className="h-full flex items-center justify-center text-gray-400 p-8 text-center">
                  <div>
                    <Loader size="lg" className="mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">
                      Initializing WebContainer
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      Setting up the preview environment. This might take a
                      moment...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 p-8 text-center">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">
                      WebContainer Error
                    </h3>
                    <p className="text-gray-400 max-w-md mb-6">
                      {webContainerError?.message ||
                        'The WebContainer environment could not be initialized. This may be due to missing browser security headers or lack of browser support.'}
                    </p>
                    <button
                      onClick={handleRefreshWebContainer}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
