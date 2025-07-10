import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js'
import { getWebContainer } from '../config/webContainer'
import { motion, AnimatePresence } from 'framer-motion'

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

    const send = () => {
        if (!message.trim()) return;
        
        const messageData = {
            message,
            sender: user
        };
        
        setMessages(prevMessages => [...prevMessages, messageData]);
        sendMessage('project-message', messageData);
        setMessage("");
        
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    };

    // Search messages function
    const searchMessages = () => {
        if (!searchTerm.trim()) return;
        
        setIsSearching(true);
        setSearchResults([]);
        setMessageError(null);
        
        sendMessage('search-messages', { searchTerm: searchTerm.trim() });
    };

    // Load more messages
    const loadMoreMessages = () => {
        if (isLoadingMore || loadedMessageCount >= totalMessageCount) return;
        
        setIsLoadingMore(true);
        sendMessage('load-more-messages', { 
            offset: loadedMessageCount, 
            limit: 20 
        });
    };

    // Toggle search mode
    const toggleSearchMode = () => {
        setIsSearchMode(!isSearchMode);
        if (isSearchMode) {
            // Exiting search mode
            setSearchResults([]);
            setSearchTerm('');
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
               ' ' + date.toLocaleDateString();
    };

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

                        webContainer?.mount(message.fileTree);

                        if (message.fileTree) {
                            setFileTree(message.fileTree || {})
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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }
    
    const runProject = async () => {
        if (!webContainer) {
            setWebContainerError("WebContainer is not available. This may be due to your browser environment or deployment restrictions.");
            return;
        }
        
        try {
            setIsLoading(true);
            await webContainer.mount(fileTree);

            const installProcess = await webContainer.spawn("npm", ["install"]);
            installProcess.output.pipeTo(new WritableStream({
                write(chunk) {
                    console.log(chunk)
                }
            }));

            if (runProcess) {
                runProcess.kill();
            }

            let tempRunProcess = await webContainer.spawn("npm", ["start"]);
            tempRunProcess.output.pipeTo(new WritableStream({
                write(chunk) {
                    console.log(chunk)
                }
            }));

            setRunProcess(tempRunProcess);

            webContainer.on('server-ready', (port, url) => {
                console.log(port, url);
                setIframeUrl(url);
                setIsLoading(false);
            });
        } catch (error) {
            console.error("Error running project:", error);
            setIsLoading(false);
        }
    };

    return (
        <main className='h-screen w-screen flex bg-slate-50 font-sans'>
            <motion.section 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="left relative flex flex-col h-screen min-w-96 bg-slate-100 border-r border-slate-200 shadow-md z-20">
                <header className='flex justify-between items-center p-3 px-4 w-full bg-white border-b border-slate-200 absolute z-10 top-0'>
                    <div className="flex gap-2">
                        <button 
                            className='flex gap-2 items-center text-slate-700 hover:text-slate-900 transition-colors py-1 px-3 rounded-md hover:bg-slate-100' 
                            onClick={() => setIsModalOpen(true)}
                        >
                            <i className="ri-user-add-line text-blue-500"></i>
                            <p className="font-medium">Add collaborator</p>
                        </button>
                        <button 
                            className='flex gap-2 items-center text-red-600 hover:text-red-700 transition-colors py-1 px-3 rounded-md hover:bg-red-50' 
                            onClick={() => setIsDeleteConfirmOpen(true)}
                        >
                            <i className="ri-delete-bin-line"></i>
                            <p className="font-medium">Delete project</p>
                        </button>
                        <button 
                            className='flex gap-2 items-center text-slate-700 hover:text-slate-900 transition-colors py-1 px-3 rounded-md hover:bg-slate-100' 
                            onClick={toggleSearchMode}
                        >
                            <i className={`${isSearchMode ? 'ri-close-line text-red-500' : 'ri-search-line text-blue-500'}`}></i>
                            <p className="font-medium">{isSearchMode ? 'Exit Search' : 'Search Messages'}</p>
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} 
                        className='p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600'
                    >
                        <i className="ri-group-line text-lg"></i>
                    </button>
                </header>
                <div className="conversation-area pt-16 pb-16 flex-grow flex flex-col h-full relative">
                    {messageError && (
                        <div className="bg-red-100 border border-red-300 text-red-700 p-3 m-3 rounded-md">
                            <p className="text-sm font-medium flex items-center">
                                <i className="ri-error-warning-line mr-2"></i>
                                {messageError}
                            </p>
                            <button 
                                className="text-xs text-red-600 mt-1 hover:underline"
                                onClick={() => setMessageError(null)}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {isSearchMode && (
                        <div className="p-3 border-b border-slate-200">
                            <div className="flex gap-2">
                                <div className="flex-grow flex items-center bg-white rounded-lg border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400 transition-all">
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                searchMessages();
                                            }
                                        }}
                                        className='p-2 px-3 border-none outline-none flex-grow text-slate-700 placeholder-slate-400' 
                                        type="text" 
                                        placeholder='Search messages...' 
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className='px-2 text-slate-400'
                                        >
                                            <i className="ri-close-line"></i>
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={searchMessages}
                                    disabled={!searchTerm.trim() || isSearching}
                                    className={`px-3 ${!searchTerm.trim() || isSearching ? 'bg-slate-300' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors flex items-center`}
                                >
                                    {isSearching ? (
                                        <i className="ri-loader-4-line animate-spin"></i>
                                    ) : (
                                        <i className="ri-search-line"></i>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {!isSearchMode && loadedMessageCount < totalMessageCount && (
                        <div className="flex justify-center p-2">
                            <button
                                onClick={loadMoreMessages}
                                disabled={isLoadingMore}
                                className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 px-4 rounded-md text-sm transition-colors flex items-center gap-1"
                            >
                                {isLoadingMore ? (
                                    <>
                                        <i className="ri-loader-4-line animate-spin"></i>
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-history-line"></i>
                                        Load earlier messages ({totalMessageCount - loadedMessageCount} more)
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {isSearchMode && searchTerm && searchResults.length === 0 && !isSearching && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                            <i className="ri-search-line text-5xl opacity-40"></i>
                            <p>No messages found matching "{searchTerm}"</p>
                        </div>
                    )}

                    <div
                        ref={messageBox}
                        className="message-box p-3 flex-grow flex flex-col gap-3 overflow-auto max-h-full scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
                    >
                        {!isSearchMode && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                                <i className="ri-chat-3-line text-5xl opacity-40"></i>
                                <p>Start a conversation with your team</p>
                                </div>
                        )}
                        
                        {!isSearchMode ? (
                            messages.map((msg, index) => (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`${msg.sender._id === 'ai' ? 'max-w-4/5' : 'max-w-3/5'} ${user && msg.sender._id === user._id?.toString() ? 'ml-auto' : ''}  message flex flex-col p-2 ${user && msg.sender._id === user._id?.toString() ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-slate-200'} w-fit rounded-lg shadow-sm`}
                                >
                                    <small className='text-xs font-medium text-slate-500 mb-1 flex items-center gap-1'>
                                        {msg.sender._id === 'ai' ? (
                                            <>
                                                <i className="ri-robot-line"></i> AI Assistant
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-user-line"></i> {msg.sender.email}
                                            </>
                                        )}
                                        {msg.timestamp && (
                                            <span className="ml-auto text-slate-400 text-xs">
                                                {formatTimestamp(msg.timestamp)}
                                            </span>
                                        )}
                                            </small>
                                    <div className={`text-sm ${user && msg.sender._id === user._id?.toString() ? 'text-slate-800' : 'text-slate-700'}`}>
                                            {msg.sender._id === 'ai' ?
                                            WriteAiMessage(msg.message) : 
                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                        }
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            searchResults.map((msg, index) => (
                            <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`${msg.sender._id === 'ai' ? 'max-w-4/5' : 'max-w-3/5'} message flex flex-col p-2 bg-yellow-50 border border-yellow-200 w-fit rounded-lg shadow-sm`}
                                >
                                    <small className='text-xs font-medium text-slate-500 mb-1 flex items-center gap-1'>
                                        {msg.sender._id === 'ai' ? (
                                            <>
                                                <i className="ri-robot-line"></i> AI Assistant
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-user-line"></i> {msg.sender.email}
                                            </>
                                        )}
                                        {msg.timestamp && (
                                            <span className="ml-auto text-slate-400 text-xs">
                                                {formatTimestamp(msg.timestamp)}
                                            </span>
                                        )}
                                    </small>
                                    <div className="text-sm text-slate-800">
                                        {msg.sender._id === 'ai' ? 
                                            WriteAiMessage(msg.message) : 
                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                        }
                                </div>
                            </motion.div>
                            ))
                        )}
                    </div>

                    <div className="inputField w-full flex absolute bottom-0 p-3 bg-white border-t border-slate-200">
                        <div className="flex w-full bg-white rounded-lg border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400 transition-all">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className='p-3 px-4 border-none outline-none flex-grow text-slate-700 placeholder-slate-400' 
                                type="text" 
                                placeholder={isSearchMode ? 'Exit search mode to send messages' : 'Type your message...'} 
                                disabled={isSearchMode}
                            />
                            <button
                                onClick={send}
                                disabled={!message.trim() || isSearchMode}
                                className={`px-4 ${message.trim() && !isSearchMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-300'} text-white transition-colors`}>
                                <i className="ri-send-plane-fill"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <AnimatePresence>
                    {isSidePanelOpen && (
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="sidePanel w-full h-full flex flex-col gap-2 bg-white absolute shadow-lg top-0 z-30"
                        >
                            <header className='flex justify-between items-center px-4 p-3 bg-slate-50 border-b border-slate-200'>
                                <h1 className='font-semibold text-lg text-slate-800 flex items-center gap-2'>
                                    <i className="ri-team-line text-blue-500"></i> Collaborators
                                </h1>
                                <button 
                                    onClick={() => setIsSidePanelOpen(false)} 
                                    className='p-2 rounded-full hover:bg-slate-200 transition-colors'
                                >
                                    <i className="ri-close-line"></i>
                                </button>
                            </header>
                            <div className="users flex flex-col gap-1 p-2 overflow-auto">
                                {project.users && project.users.length > 0 ? (
                                    project.users.map((user, index) => (
                                <motion.div 
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            className="user cursor-pointer hover:bg-slate-100 rounded-md p-3 flex gap-3 items-center"
                                        >
                                            <div className='aspect-square rounded-full flex items-center justify-center w-10 h-10 text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm'>
                                                <span className="text-lg font-medium">{user.email[0].toUpperCase()}</span>
                                        </div>
                                        <div>
                                                <h2 className='font-medium text-slate-800'>{user.email}</h2>
                                                <p className="text-xs text-slate-500">Online</p>
                                        </div>
                                    </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                                        <i className="ri-user-add-line text-3xl mb-2"></i>
                                        <p>No collaborators yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.section>

            <motion.section 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="right flex-grow h-full flex bg-white">
                <div className="explorer h-full max-w-64 min-w-52 bg-slate-50 border-r border-slate-200 overflow-auto">
                    <div className="p-3 border-b border-slate-200">
                        <h2 className="text-slate-700 font-medium flex items-center gap-2">
                            <i className="ri-folder-line text-blue-500"></i> Project Files
                        </h2>
                    </div>
                    <div className="file-tree w-full">
                        {Object.keys(fileTree).length > 0 ? (
                                Object.keys(fileTree).map((file, index) => (
                                    <motion.button
                                        key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                        onClick={() => {
                                            setCurrentFile(file)
                                            setOpenFiles([...new Set([...openFiles, file])])
                                        }}
                                    className={`tree-element cursor-pointer p-2 px-4 flex items-center gap-2 hover:bg-slate-100 w-full border-b border-slate-100 transition-colors ${currentFile === file ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                                >
                                    <i className={`${file.endsWith('.js') || file.endsWith('.jsx') ? 'ri-javascript-line' : 
                                                   file.endsWith('.html') ? 'ri-html5-line' : 
                                                   file.endsWith('.css') ? 'ri-css3-line' : 
                                                   file.endsWith('.json') ? 'ri-file-code-line' : 'ri-file-line'} 
                                                   ${currentFile === file ? 'text-blue-500' : 'text-slate-400'}`}></i>
                                    <p className='font-medium text-sm'>{file}</p>
                                    </motion.button>
                                ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-400 p-4">
                                <i className="ri-file-add-line text-2xl mb-2"></i>
                                <p className="text-sm text-center">No files in project yet</p>
                            </div>
                            )}
                    </div>
                </div>

                <div className="code-editor flex flex-col flex-grow h-full shrink">
                    <div className="top flex justify-between w-full border-b border-slate-200 bg-slate-50">
                        <div className="files flex overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                                {openFiles.map((file, index) => (
                                <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                    className={`open-file cursor-pointer p-2 px-4 flex items-center gap-2 border-r border-slate-200 min-w-max transition-colors
                                              ${currentFile === file ? 'bg-white border-b-2 border-b-blue-500' : 'hover:bg-slate-100'}`}
                                >
                                    <i className={`${file.endsWith('.js') || file.endsWith('.jsx') ? 'ri-javascript-line' : 
                                                 file.endsWith('.html') ? 'ri-html5-line' : 
                                                 file.endsWith('.css') ? 'ri-css3-line' : 
                                                 file.endsWith('.json') ? 'ri-file-code-line' : 'ri-file-line'} 
                                                 ${currentFile === file ? 'text-blue-500' : 'text-slate-400'}`}></i>
                                    <p className={`font-medium text-sm ${currentFile === file ? 'text-slate-800' : 'text-slate-600'}`}>{file}</p>
                                    {currentFile === file && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenFiles(openFiles.filter(f => f !== file));
                                                if (currentFile === file) {
                                                    setCurrentFile(openFiles.length > 1 ? openFiles.find(f => f !== file) : null);
                                                }
                                            }}
                                            className="ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
                                        >
                                            <i className="ri-close-line text-xs"></i>
                                        </button>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="actions flex gap-2 p-2 pr-4">
                            {webContainerError && (
                                <div className="text-xs text-red-500 flex items-center mr-2">
                                    <i className="ri-error-warning-line mr-1"></i>
                                    {webContainerError}
                                </div>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={runProject}
                                disabled={isLoading || Object.keys(fileTree).length === 0 || !webContainer}
                                className={`py-1 px-4 rounded-md flex items-center gap-2 transition-all shadow-sm
                                         ${isLoading || Object.keys(fileTree).length === 0 || !webContainer ? 
                                         'bg-slate-300 text-slate-500 cursor-not-allowed' : 
                                         'bg-green-500 hover:bg-green-600 text-white'}`}
                                title={!webContainer ? "WebContainer is not available in this environment" : ""}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="ri-loader-4-line animate-spin"></i>
                                        <span>Running...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-play-fill"></i>
                                        <span>Run Project</span>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                    
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {currentFile && fileTree[currentFile] && 
                         fileTree[currentFile].file && 
                         fileTree[currentFile].file.contents ? (
                            <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50 relative">
                                <pre className="hljs h-full p-4 text-sm">
                                    <code
                                        className="hljs h-full outline-none font-mono leading-relaxed"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => {
                                            const updatedContent = e.target.innerText;
                                            const ft = {
                                                ...fileTree,
                                                [currentFile]: {
                                                    file: {
                                                        contents: updatedContent
                                                    }
                                                }
                                            }
                                            setFileTree(ft)
                                            saveFileTree(ft)
                                        }}
                                        dangerouslySetInnerHTML={{ 
                                            __html: hljs.highlight(
                                                currentFile.endsWith('.js') || currentFile.endsWith('.jsx') ? 'javascript' :
                                                currentFile.endsWith('.html') ? 'html' :
                                                currentFile.endsWith('.css') ? 'css' :
                                                currentFile.endsWith('.json') ? 'json' : 'javascript',
                                                fileTree[currentFile].file.contents || ''
                                            ).value 
                                        }}
                                        style={{
                                            whiteSpace: 'pre-wrap',
                                            paddingBottom: '25rem',
                                            counterSet: 'line-numbering',
                                        }}
                                    />
                                </pre>
                                    </div>
                                ) : (
                            <div className="flex flex-col items-center justify-center h-full w-full text-slate-400">
                                {openFiles.length === 0 ? (
                                    <>
                                        <i className="ri-code-line text-6xl mb-4 opacity-30"></i>
                                        <p className="text-lg">Select a file to start coding</p>
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-file-search-line text-5xl mb-4 opacity-30"></i>
                                        <p className="text-lg">File not found or content empty</p>
                                        {currentFile && (
                                            <button
                                                onClick={() => {
                                                    // Create missing file structure if file exists in openFiles but not in fileTree
                                                    if (!fileTree[currentFile] || !fileTree[currentFile].file) {
                                                        const ft = {
                                                            ...fileTree,
                                                            [currentFile]: {
                                                                file: {
                                                                    contents: ''
                                                                }
                                                            }
                                                        };
                                                        setFileTree(ft);
                                                        saveFileTree(ft);
                                                    }
                                                }}
                                                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                                            >
                                                Create file
                                            </button>
                                        )}
                                    </>
                        )}
                    </div>
                        )}
                    </div>
                </div>

                    {iframeUrl && webContainer && (
                        <motion.div 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'min-w-96' }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col h-full border-l border-slate-200"
                    >
                        <div className="address-bar flex items-center bg-slate-50 border-b border-slate-200 p-2">
                            <div className="flex items-center bg-white w-full rounded border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-blue-400">
                                <span className="px-2 text-slate-400"><i className="ri-globe-line"></i></span>
                                <input 
                                    type="text"
                                    onChange={(e) => setIframeUrl(e.target.value)}
                                    value={iframeUrl} 
                                    className="w-full p-2 outline-none text-sm" 
                                />
                                <button 
                                    onClick={() => setIframeUrl(iframeUrl)} 
                                    className="px-3 text-slate-500 hover:text-slate-700"
                                >
                                    <i className="ri-refresh-line"></i>
                                </button>
                                            </div>
                                            </div>
                        <div className="relative h-full flex-grow">
                            <iframe src={iframeUrl} className="w-full h-full border-none" title="Preview"></iframe>
                                        </div>
                                    </motion.div>
                                )}
            </motion.section>
            
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







