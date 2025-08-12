import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import { getWebContainer } from '../config/webContainer'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatInterface } from '../components/ChatInterface'
import { WilderFileExplorer as FileExplorer } from '../components/FileExplorer'
import { TabView } from '../components/TabView'
import { CodeEditor } from '../components/CodeEditor'
import { PreviewFrame } from '../components/PreviewFrame'

function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)
            ref.current.removeAttribute('data-highlighted')
        }
    }, [props.className, props.children])

    return <code {...props} ref={ref} />
}

const Project = () => {
    const location = useLocation()
    const navigate = useNavigate()

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState(new Set())
    const [project, setProject] = useState(location.state?.project || null)
    const [message, setMessage] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = useRef(null)

    const [users, setUsers] = useState([])
    const [messages, setMessages] = useState([])
    const [fileTree, setFileTree] = useState({})
    const [searchTerm, setSearchTerm] = useState('')

    const [currentFile, setCurrentFile] = useState(null)
    const [openFiles, setOpenFiles] = useState([])

    const [webContainer, setWebContainer] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null)

    const [runProcess, setRunProcess] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

    // New state for message features
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [totalMessageCount, setTotalMessageCount] = useState(0)
    const [loadedMessageCount, setLoadedMessageCount] = useState(0)
    const [messageError, setMessageError] = useState(null)
    const [isSearchMode, setIsSearchMode] = useState(false)

    // New state for WebContainer-related UI
    const [webContainerError, setWebContainerError] = useState(null)

    // New state for integrated features
    const [activeTab, setActiveTab] = useState('code')
    const [selectedFile, setSelectedFile] = useState(null)
    const [files, setFiles] = useState([])
    const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(true)

    // Helper function to convert file tree object to array format for FileExplorer
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

    // Handle AI messages and file generation
    const handleAIMessage = async (message) => {
        // Add user message to chat
        const userMessage = {
            id: Date.now().toString(),
            message: `@ai ${message}`,
            sender: {
                _id: user?._id || 'current-user',
                email: user?.email || 'You'
            },
            timestamp: new Date().toISOString(),
            isAI: false
        };
        
        setMessages(prev => [...prev, userMessage]);

        // Send to AI and handle response through existing socket system
        sendMessage('project-message', userMessage);
    };

    // Handle regular chat messages
    const handleRegularMessage = (message) => {
        const userMessage = {
            id: Date.now().toString(),
            message,
            sender: {
                _id: user?._id || 'current-user',
                email: user?.email || 'You'
            },
            timestamp: new Date().toISOString(),
            isAI: false
        };
        
        setMessages(prev => [...prev, userMessage]);
        sendMessage('project-message', userMessage);
    };

    // Handle file updates from the code editor
    const handleFileUpdate = (updatedFile) => {
        // Update the fileTree format
        const updatedFileTree = {
            ...fileTree,
            [updatedFile.name]: {
                file: {
                    contents: updatedFile.content || ''
                }
            }
        };
        
        setFileTree(updatedFileTree);
        setFiles(convertFileTreeToArray(updatedFileTree));
        
        // Save to backend
        saveFileTree(updatedFileTree);
        
        // Update webcontainer if available
        if (webContainer) {
            try {
                webContainer.fs.writeFile(
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

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    }



    function WriteAiMessage(message) {
        const messageObject = JSON.parse(message)
            
            return (
            <div className='overflow-auto bg-slate-800 text-white rounded-md p-3 shadow-md border border-slate-700'>
                        <Markdown
                            children={messageObject.text}
                            options={{
                                overrides: {
                                    code: SyntaxHighlightedCode,
                                },
                            }}
                        />
            </div>)
    }

    const addCollaborators = async () => {
        try {
            const res = await axios.put("/projects/add-user", {
                projectId: project._id,
                users: Array.from(selectedUserId)
            });
            console.log("Collaborators added:", res.data);
            setProject(res.data.project);
            setIsModalOpen(false);
            setSelectedUserId(new Set());
        } catch (err) {
            console.error("Error adding collaborators:", err);
        }
    };

    const deleteProject = async () => {
        try {
            const res = await axios.delete(`/projects/delete-project/${project._id}`);
            console.log("Project deleted:", res.data);
            navigate('/home');
        } catch (err) {
            console.error("Error deleting project:", err);
        }
    };

    useEffect(() => {
        // Check if project is defined, if not redirect to home
        if (!project || !project._id) {
            console.error("No project data available");
            navigate('/home');
            return;
        }

        // Initialize socket connection
        const socketInstance = initializeSocket(project._id);
        
        // Listen for socket errors
        const handleSocketError = (event) => {
            console.error("Socket error:", event.detail);
            // If it's an authentication error, we might need to redirect
            if (event.detail.message && event.detail.message.includes("Authentication error")) {
                console.log("Authentication error detected, redirecting to home");
                navigate('/');
            }
        };
        
        window.addEventListener('socket_error', handleSocketError);

        // Only attempt to load WebContainer in browser environment
        if (typeof window !== 'undefined') {
            getWebContainer().then(container => {
                if (container) {
                    setWebContainer(container);
                    console.log("container started");
                } else {
                    console.warn("WebContainer initialization failed or not supported in this environment");
                    setWebContainerError("WebContainer failed to initialize. Some features may not be available.");
                }
            }).catch(err => {
                console.error("Error initializing WebContainer:", err);
                setWebContainerError("Error initializing WebContainer: " + (err.message || "Unknown error"));
            });
        }

        // Fetch project data and collaborators
        const fetchProjectData = async () => {
            try {
                const res = await axios.get(`/projects/get-project/${project._id}`);
                console.log("Project data:", res.data.project);
                setProject(res.data.project);
                setFileTree(res.data.project.fileTree || {});
            } catch (err) {
                console.error("Error fetching project data:", err);
                if (err.response?.status === 401) {
                    // Unauthorized - redirect to home
                    navigate('/');
                }
            }
        };

        // Fetch all users for collaborator selection
        const fetchUsers = async () => {
            try {
                const res = await axios.get('/users/all');
                console.log("All users:", res.data.users);
                setUsers(res.data.users);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        };

        fetchProjectData();
        fetchUsers();

        // Handle loading cached messages
        receiveMessage('load-messages', (data) => {
            console.log("Loading cached messages:", data);
            if (data.messages && Array.isArray(data.messages)) {
                setMessages(data.messages);
                setLoadedMessageCount(data.messages.length);
                setTotalMessageCount(data.totalCount || data.messages.length);
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
            }
        });

        // Handle search results
        receiveMessage('search-results', (results) => {
            console.log("Search results:", results);
            setSearchResults(results || []);
            setIsSearching(false);
        });

        // Handle loading more messages
        receiveMessage('more-messages-loaded', (olderMessages) => {
            console.log("Loaded more messages:", olderMessages);
            if (Array.isArray(olderMessages) && olderMessages.length > 0) {
                setMessages(prevMessages => [...olderMessages, ...prevMessages]);
                setLoadedMessageCount(prev => prev + olderMessages.length);
            }
            setIsLoadingMore(false);
        });

        // Handle errors
        receiveMessage('error', (error) => {
            console.error("Socket error:", error);
            setMessageError(error.message || "An unknown error occurred");
            setIsSearching(false);
            setIsLoadingMore(false);
        });

        receiveMessage('project-message', data => {
            console.log("Received message:", data);
            
            if (data.sender._id !== user._id) {
                if (data.sender._id === 'ai') {
                    try {
                        const message = JSON.parse(data.message);
                        console.log("AI message:", message);

                        if (webContainer && message.fileTree) {
                            webContainer.mount(message.fileTree);
                            setFileTree(message.fileTree || {});
                            setFiles(convertFileTreeToArray(message.fileTree));
                        }
                } catch (error) {
                        console.error("Error parsing AI message:", error);
                    }
                }
                
                setMessages(prevMessages => [...prevMessages, data]);
                setLoadedMessageCount(prev => prev + 1);
                
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
            }
        });

        // Add socket event for project updates
        receiveMessage('project-update', (updatedProject) => {
            console.log("Project updated:", updatedProject);
            setProject(updatedProject);
        });

        return () => {
            // Cleanup socket event listeners and remove error handler
            const events = [
                'load-messages', 
                'search-results', 
                'more-messages-loaded', 
                'error', 
                'project-message',
                'project-update'
            ];
            
            events.forEach(event => {
                window.socket?.off(event);
            });
            
            window.removeEventListener('socket_error', handleSocketError);
        };
    }, [project._id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Convert fileTree to files array when fileTree changes
    useEffect(() => {
        if (Object.keys(fileTree).length > 0) {
            setFiles(convertFileTreeToArray(fileTree));
        }
    }, [fileTree])

    function saveFileTree(ft) {
        axios.put('/projects/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }

    function scrollToBottom() {
        if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight
        }
    }



    return (
        <main className='h-screen w-screen flex bg-gray-950 font-sans'>
            {/* Fixed Chat Sidebar */}
            <AnimatePresence>
                {isChatSidebarOpen && (
                    <motion.section 
                        initial={{ opacity: 0, x: -300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        transition={{ duration: 0.3 }}
                        className="fixed left-0 top-0 h-screen w-80 bg-gray-900 border-r border-gray-800 shadow-xl z-50 flex flex-col"
                    >
                        {/* Chat Sidebar Header */}
                        <header className='flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700'>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <i className="ri-chat-3-line text-white text-sm"></i>
                                </div>
                                <div>
                                    <h2 className="text-white font-semibold text-sm">{project?.name || 'Project Chat'}</h2>
                                    <p className="text-gray-400 text-xs">AI & Collaborators</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    className='p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white' 
                                    onClick={() => setIsModalOpen(true)}
                                    title="Add collaborators"
                                >
                                    <i className="ri-user-add-line text-sm"></i>
                                </button>
                                <button 
                                    onClick={() => setIsChatSidebarOpen(false)} 
                                    className='p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white'
                                    title="Close chat"
                                >
                                    <i className="ri-close-line text-sm"></i>
                                </button>
                            </div>
                        </header>
                        
                        {/* Chat Interface */}
                        <div className="flex-1 overflow-hidden">
                            <ChatInterface
                                messages={messages}
                                onAIMessage={handleAIMessage}
                                onRegularMessage={handleRegularMessage}
                                loading={isLoading}
                                projectId={project?._id}
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
                                        offset: loadedMessageCount, 
                                        limit: 20 
                                    });
                                }}
                            />
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isChatSidebarOpen ? 'ml-80' : 'ml-0'}`}>
                {/* Top Header */}
                <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {!isChatSidebarOpen && (
                            <button
                                onClick={() => setIsChatSidebarOpen(true)}
                                className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                                title="Open chat"
                            >
                                <i className="ri-chat-3-line"></i>
                            </button>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <i className="ri-code-line text-white text-sm"></i>
                            </div>
                            <div>
                                <h1 className="text-white font-semibold">{project?.name || 'Untitled Project'}</h1>
                                <p className="text-gray-400 text-sm">Collaborative Development</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            className='flex gap-2 items-center text-red-400 hover:text-red-300 transition-colors py-2 px-3 rounded-lg hover:bg-red-500/10' 
                            onClick={() => setIsDeleteConfirmOpen(true)}
                        >
                            <i className="ri-delete-bin-line"></i>
                            <span className="text-sm">Delete</span>
                        </button>
                        <button 
                            onClick={() => navigate('/home')}
                            className='flex gap-2 items-center text-gray-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-gray-800'
                        >
                            <i className="ri-home-line"></i>
                            <span className="text-sm">Home</span>
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* File Explorer */}
                    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                        <div className="p-4 border-b border-gray-800">
                            <h3 className="text-white font-medium">Files</h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <FileExplorer 
                                files={files} 
                                onFileSelect={setSelectedFile} 
                                selectedPath={selectedFile?.path}
                            />
                        </div>
                    </div>

                    {/* Main Editor/Preview Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Tab Bar */}
                        <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between">
                            <TabView activeTab={activeTab} onTabChange={setActiveTab} />
                            {webContainerError && (
                                <div className="text-xs text-red-400 flex items-center">
                                    <i className="ri-error-warning-line mr-1"></i>
                                    WebContainer Error
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden bg-gray-950">
                            <div className="h-full rounded-lg overflow-hidden border border-gray-800 bg-gray-900 shadow-xl m-4">
                                {activeTab === 'code' ? (
                                    <CodeEditor
                                        file={selectedFile}
                                        onUpdateFile={handleFileUpdate}
                                    />
                                ) : webContainer ? (
                                    <PreviewFrame
                                        webContainer={webContainer}
                                        files={files}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 p-8 text-center">
                                        <div>
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                                                <i className="ri-error-warning-line text-2xl text-amber-500"></i>
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-300 mb-2">
                                                WebContainer Error
                                            </h3>
                                            <p className="text-gray-400 max-w-md mb-6">
                                                {webContainerError || 'The WebContainer environment could not be initialized.'}
                                            </p>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                            >
                                                <i className="ri-refresh-line"></i>
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
            
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="bg-white p-6 rounded-lg w-96 max-w-full relative shadow-xl"
                        >
                            <header className='flex justify-between items-center mb-4 pb-2 border-b border-slate-200'>
                                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                                    <i className="ri-user-add-line text-blue-500"></i> Add Collaborators
                                </h2>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className='p-2 hover:bg-slate-100 rounded-full transition-colors'
                                >
                                    <i className="ri-close-line"></i>
                                </button>
                            </header>
                            
                            <div className="mb-4 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="ri-search-line text-gray-400"></i>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Search collaborators by email"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button 
                                            onClick={() => setSearchTerm('')}
                                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                        >
                                            <i className="ri-close-line"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {users.length > 0 ? (
                                <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto pr-1">
                                    {users
                                        .filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((user, index) => (
                                    <motion.div 
                                            key={user._id}
                                            initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className={`user cursor-pointer rounded-lg hover:bg-slate-100 
                                                   ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 
                                                     'bg-blue-50 border border-blue-200' : 'border border-transparent'} 
                                                   p-3 flex gap-3 items-center transition-all`} 
                                            onClick={() => handleUserClick(user._id)}
                                        >
                                            <div className='aspect-square relative rounded-full w-10 h-10 flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-blue-600'>
                                                <span className="text-lg font-medium">{user.email[0].toUpperCase()}</span>
                                            </div>
                                            <div className="flex-grow">
                                                <h1 className='font-medium text-slate-800'>{user.email}</h1>
                                                <p className="text-xs text-slate-500">Developer</p>
                                            </div>
                                            {Array.from(selectedUserId).indexOf(user._id) != -1 && (
                                                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                                    <i className="ri-check-line"></i>
                                            </div>
                                )}
                                        </motion.div>
                                    ))}
                            </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                    <i className="ri-loader-4-line text-3xl animate-spin mb-2"></i>
                                    <p>Loading users...</p>
                                </div>
                            )}
                            
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={addCollaborators}
                                disabled={selectedUserId.size === 0}
                                className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-md text-white shadow-md flex items-center gap-2
                                         ${selectedUserId.size === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                            >
                                <i className="ri-user-add-line"></i>
                                Add Selected ({selectedUserId.size})
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDeleteConfirmOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="bg-white p-6 rounded-lg w-96 max-w-full relative shadow-xl"
                        >
                            <header className='flex justify-between items-center mb-4 pb-2 border-b border-slate-200'>
                                <h2 className='text-xl font-semibold text-slate-800 flex items-center gap-2'>
                                    <i className="ri-error-warning-line text-red-500"></i> Delete Project
                                </h2>
                                <button 
                                    onClick={() => setIsDeleteConfirmOpen(false)} 
                                    className='p-2 hover:bg-slate-100 rounded-full transition-colors'
                                >
                                    <i className="ri-close-line"></i>
                                </button>
                            </header>
                            
                            <div className="mb-6">
                                <p className="text-slate-700 mb-2">Are you sure you want to delete this project?</p>
                                <p className="text-slate-500 text-sm">This action cannot be undone. All files, conversations, and data for <span className="font-medium text-slate-800">{project.name}</span> will be permanently deleted.</p>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={deleteProject}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center gap-2"
                                >
                                    <i className="ri-delete-bin-line"></i>
                                    Delete Project
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}

export default Project







