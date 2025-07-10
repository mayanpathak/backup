// import React, { useContext, useState, useEffect } from 'react';
// import { UserContext } from '../context/user.context'; // Assuming path is correct
// import axios from "../config/axios"; // Assuming path is correct
// import { useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FiPlus, FiUser, FiFolder, FiX, FiLogOut } from 'react-icons/fi'; // Ensure react-icons is installed

// const Home = () => {
//     const { user, clearUser } = useContext(UserContext); // User should contain user details if needed for display
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [projectName, setProjectName] = useState("");
//     const [projects, setProjects] = useState([]);
//     const [error, setError] = useState(""); // Error for project creation modal and project loading
//     const [isLoading, setIsLoading] = useState(true); // Loading state for projects

//     const navigate = useNavigate();

//     const colors = [
//         "bg-indigo-600", "bg-purple-600", "bg-pink-600", 
//         "bg-blue-600", "bg-emerald-600", "bg-amber-600"
//     ];

//     // Handle logout
//     const handleLogout = async () => {
//         try {
//             await axios.get('/users/logout', { withCredentials: true }); // Ensure cookies are sent if needed for logout
//             clearUser(); // Clear user from context
//             navigate('/'); // Navigate to landing page
//         } catch (err) {
//             console.error('Logout error:', err.response?.data?.message || err.message);
//             // Even if the server request fails, proceed with logout on client-side
//             clearUser();
//             navigate('/');
//         }
//     };

//     // Function to create a new project
//     function createProject(e) {
//         e.preventDefault();
        
//         if (!projectName.trim()) {
//             setError("Project name cannot be empty");
//             return;
//         }
//         setError(""); // Clear previous errors

//         // Indicate loading for create project action (optional, good UX)
//         // For example, you could set a specific loading state for the modal button
        
//         axios.post('/projects/create', { name: projectName }, { withCredentials: true })
//             .then((res) => {
//                 setIsModalOpen(false);
//                 setProjectName("");
//                 fetchProjects(); // Refresh project list
//             })
//             .catch((err) => {
//                 setError(err.response?.data?.error || err.response?.data?.message || "Failed to create project. Please try again.");
//             });
//     }

//     // Function to fetch all projects for the user
//     const fetchProjects = () => {
//         setIsLoading(true);
//         setError(""); // Clear previous page-level errors
//         axios.get('/projects/all', { withCredentials: true })
//             .then((res) => {
//                 setProjects(res.data.projects || []); // Ensure projects is an array
//                 setIsLoading(false);
//             })
//             .catch(err => {
//                 console.error('Error fetching projects:', err.response?.data?.message || err.message);
//                 setError("Failed to load your projects. Please try refreshing the page."); // Set an error message for display
//                 setIsLoading(false);
//                 setProjects([]); // Set to empty array on error
//             });
//     }

//     // Fetch projects when the component mounts
//     useEffect(() => {
//         fetchProjects();
//     }, []); // Empty dependency array ensures this runs once on mount

//     // Get initials for the avatar from a name or ID string
//     const getInitials = (nameOrId) => {
//         if (!nameOrId || typeof nameOrId !== 'string') return '??';
//         return nameOrId
//             .split(' ')
//             .map(word => word[0])
//             .join('')
//             .toUpperCase()
//             .substring(0, 2);
//     };

//     // Get a consistent color from the palette based on project ID
//     const getRandomColor = (id) => {
//         if (!id) return colors[0]; // Default color if id is missing
//         // Simple hash function to get a somewhat consistent index
//         let hash = 0;
//         for (let i = 0; i < id.length; i++) {
//             hash = id.charCodeAt(i) + ((hash << 5) - hash);
//         }
//         const index = Math.abs(hash % colors.length);
//         return colors[index];
//     };

//     // Animation variants for Framer Motion
//     const containerVariants = {
//         hidden: { opacity: 0 },
//         visible: {
//             opacity: 1,
//             transition: { staggerChildren: 0.1 }
//         }
//     };

//     const itemVariants = {
//         hidden: { y: 20, opacity: 0 },
//         visible: {
//             y: 0,
//             opacity: 1,
//             transition: { type: "spring", stiffness: 100 }
//         }
//     };

//     const modalVariants = {
//         hidden: { opacity: 0, scale: 0.8 },
//         visible: { 
//             opacity: 1, 
//             scale: 1,
//             transition: { type: "spring", damping: 25, stiffness: 500 }
//         },
//         exit: { 
//             opacity: 0, 
//             scale: 0.8,
//             transition: { duration: 0.2 } 
//         }
//     };

//     return (
//         <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
//             <motion.div 
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5 }}
//                 className="max-w-6xl mx-auto"
//             >
//                 <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
//                     <motion.h1 
//                         initial={{ opacity: 0, x: -20 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         className="text-3xl font-bold text-slate-800"
//                     >
//                         Your Projects
//                     </motion.h1>
                    
//                     <div className="flex items-center gap-3">
//                         <motion.button
//                             whileHover={{ scale: 1.05 }}
//                             whileTap={{ scale: 0.95 }}
//                             onClick={handleLogout}
//                             className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg transition-all duration-200 text-sm sm:text-base"
//                         >
//                             <FiLogOut className="text-lg" />
//                             <span>Logout</span>
//                         </motion.button>
                        
//                         <motion.button
//                             whileHover={{ scale: 1.05 }}
//                             whileTap={{ scale: 0.95 }}
//                             onClick={() => {
//                                 setIsModalOpen(true);
//                                 setError(""); // Clear previous modal errors
//                                 setProjectName(""); // Clear previous project name
//                             }}
//                             className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 text-sm sm:text-base"
//                         >
//                             <FiPlus className="text-lg" />
//                             <span>New Project</span>
//                         </motion.button>
//                     </div>
//                 </div>

//                 {/* Display page-level errors if any (e.g., for fetching projects) */}
//                 {error && !isModalOpen && ( // Only show page error if modal is not open (modal has its own error display)
//                      <motion.div 
//                         initial={{ opacity: 0, y: -10 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg text-center"
//                     >
//                         {error}
//                     </motion.div>
//                 )}


//                 {isLoading ? (
//                     <div className="flex justify-center items-center h-64">
//                         <motion.div
//                             animate={{ rotate: 360 }}
//                             transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
//                             className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full"
//                         />
//                     </div>
//                 ) : !error && projects.length === 0 ? ( // Show "No projects" only if no error and projects are empty
//                     <motion.div 
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         className="bg-white rounded-xl shadow-xl p-10 text-center"
//                     >
//                         <img 
//                             src="https://placehold.co/300x200/E2E8F0/4A5568?text=No+Projects+Yet" 
//                             alt="No projects illustration" 
//                             className="mx-auto mb-6 opacity-70 rounded"
//                             onError={(e) => { 
//                                 e.target.onerror = null; 
//                                 e.target.src="https://placehold.co/300x200/E9E9E9/B0B0B0?text=Image+Error"; 
//                             }}
//                         />
//                         <h2 className="text-2xl font-semibold text-slate-700 mb-2">No projects yet</h2>
//                         <p className="text-slate-500 mb-6">Create your first project to get started with collaboration.</p>
//                         <motion.button
//                             whileHover={{ scale: 1.05 }}
//                             whileTap={{ scale: 0.95 }}
//                             onClick={() => {
//                                 setIsModalOpen(true);
//                                 setError(""); // Clear any page-level error before opening modal
//                                 setProjectName("");
//                             }}
//                             className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200"
//                         >
//                             <FiPlus className="text-lg" />
//                             <span>Create Project</span>
//                         </motion.button>
//                     </motion.div>
//                 ) : projects.length > 0 && ( // Only show projects if there are any
//                     <motion.div 
//                         variants={containerVariants}
//                         initial="hidden"
//                         animate="visible"
//                         className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
//                     >
//                         {/* "Add New Project" card first */}
//                         <motion.div
//                             variants={itemVariants}
//                             whileHover={{ scale: 1.03, y: -5 }}
//                             whileTap={{ scale: 0.97 }}
//                             onClick={() => {
//                                 setIsModalOpen(true);
//                                 setError("");
//                                 setProjectName("");
//                             }}
//                             className="bg-white flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 cursor-pointer h-64 shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out"
//                         >
//                             <motion.div 
//                                 whileHover={{ rotate: 90 }}
//                                 transition={{ duration: 0.2 }}
//                                 className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4"
//                             >
//                                 <FiPlus className="text-indigo-600 text-3xl" />
//                             </motion.div>
//                             <h3 className="text-lg font-semibold text-slate-700">New Project</h3>
//                             <p className="text-sm text-slate-500 mt-1 text-center">Start a new collaboration</p>
//                         </motion.div>

//                         {projects.map((project) => (
//                             <motion.div 
//                                 key={project._id} // Ensure project._id is unique and stable
//                                 variants={itemVariants}
//                                 whileHover={{ scale: 1.03, y: -5 }}
//                                 whileTap={{ scale: 0.97 }}
//                                 onClick={() => {
//                                     navigate(`/project`, { state: { project } }); // Pass project data to project page
//                                 }}
//                                 className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer h-64 flex flex-col"
//                             >
//                                 <div className={`h-28 ${getRandomColor(project._id)} p-6 relative flex flex-col justify-between`}>
//                                     <FiFolder className="text-white/10 text-8xl absolute -right-3 -top-3 transform rotate-12" />
//                                     <div>
//                                         <h2 className="text-xl font-bold text-white relative truncate" title={project.name}>
//                                             {project.name}
//                                         </h2>
//                                         <p className="text-xs text-white/80 mt-1 relative">
//                                             Created {new Date(project.createdAt || Date.now()).toLocaleDateString()}
//                                         </p>
//                                     </div>
//                                 </div>
//                                 <div className="p-6 flex-1 flex flex-col justify-between">
//                                     <div className="flex items-center text-slate-600 mb-2">
//                                         <FiUser className="mr-2 text-slate-400" />
//                                         <span className="text-sm">{project.users?.length || 0} Collaborator{(project.users?.length || 0) !== 1 ? 's' : ''}</span>
//                                     </div>
//                                     <div className="flex -space-x-2 overflow-hidden mt-auto">
//                                         {project.users?.slice(0, 3).map((userId, i) => ( // Ensure project.users exists
//                                             <div 
//                                                 key={userId || i} // Use userId if available and unique, fallback to index
//                                                 title={userId} // Show full ID on hover for debugging or info
//                                                 className={`${colors[i % colors.length]} w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium ring-2 ring-white`}
//                                             >
//                                                 {getInitials(userId?.substring(0, 6) || '??')} 
//                                             </div>
//                                         ))}
//                                         {project.users?.length > 3 && (
//                                             <div className="bg-slate-200 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ring-2 ring-white">
//                                                 +{project.users.length - 3}
//                                             </div>
//                                         )}
//                                         {(!project.users || project.users.length === 0) && (
//                                             <p className="text-xs text-slate-400">No collaborators yet.</p>
//                                         )}
//                                     </div>
//                                 </div>
//                             </motion.div>
//                         ))}
//                     </motion.div>
//                 )}
//             </motion.div>

//             <AnimatePresence>
//                 {isModalOpen && (
//                     <motion.div 
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         exit={{ opacity: 0 }}
//                         className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//                         onClick={() => setIsModalOpen(false)} // Close on overlay click
//                     >
//                         <motion.div
//                             variants={modalVariants}
//                             initial="hidden"
//                             animate="visible"
//                             exit="exit"
//                             onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
//                             className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
//                         >
//                             <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
//                                 <h2 className="text-xl font-semibold">Create New Project</h2>
//                                 <button 
//                                     onClick={() => setIsModalOpen(false)}
//                                     className="text-indigo-100 hover:text-white transition-colors"
//                                     aria-label="Close modal"
//                                 >
//                                     <FiX className="text-2xl" />
//                                 </button>
//                             </div>
                            
//                             <div className="p-6">
//                                 {error && ( // Display error specific to modal operations
//                                     <motion.div 
//                                         initial={{ opacity: 0, y: -10 }}
//                                         animate={{ opacity: 1, y: 0 }}
//                                         className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-md"
//                                     >
//                                         {error}
//                                     </motion.div>
//                                 )}
                                
//                                 <form onSubmit={createProject} className="space-y-5">
//                                     <div>
//                                         <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
//                                         <input
//                                             id="projectName" // htmlFor matches id
//                                             onChange={(e) => setProjectName(e.target.value)}
//                                             value={projectName}
//                                             type="text" 
//                                             placeholder="Enter project name" 
//                                             className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-150" 
//                                             required 
//                                         />
//                                     </div>
                                    
//                                     <div className="flex justify-end gap-3 pt-2">
//                                         <motion.button 
//                                             whileHover={{ scale: 1.05 }}
//                                             whileTap={{ scale: 0.95 }}
//                                             type="button" 
//                                             className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" 
//                                             onClick={() => setIsModalOpen(false)}
//                                         >
//                                             Cancel
//                                         </motion.button>
//                                         <motion.button 
//                                             whileHover={{ scale: 1.05 }}
//                                             whileTap={{ scale: 0.95 }}
//                                             type="submit" 
//                                             className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors"
//                                         >
//                                             Create Project
//                                         </motion.button>
//                                     </div>
//                                 </form>
//                             </div>
//                         </motion.div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </main>
//     );
// };

// export default Home;







import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from "../config/axios";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiUser, FiFolder, FiX, FiLogOut } from 'react-icons/fi';

const Home = () => {
    const { user, clearUser } = useContext(UserContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const colors = [
        "bg-indigo-600", "bg-purple-600", "bg-pink-600",
        "bg-blue-600", "bg-emerald-600", "bg-amber-600"
    ];

    const handleLogout = async () => {
        try {
            await axios.get('/users/logout', { withCredentials: true });
            clearUser();
            navigate('/');
        } catch {
            clearUser();
            navigate('/');
        }
    };

    const createProject = (e) => {
        e.preventDefault();
        if (!projectName.trim()) return;
        axios.post('/projects/create', { name: projectName }, { withCredentials: true })
            .then(() => {
                setIsModalOpen(false);
                setProjectName("");
                fetchProjects();
            });
    };

    const fetchProjects = () => {
        setIsLoading(true);
        axios.get('/projects/all', { withCredentials: true })
            .then((res) => {
                setProjects(res.data.projects || []);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
                setProjects([]);
            });
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const getInitials = (text) => {
        if (!text || typeof text !== 'string') return '??';
        return text.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
    };

    const getRandomColor = (id) => {
        if (!id) return colors[0];
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % colors.length);
        return colors[index];
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: { type: "spring", damping: 25, stiffness: 500 }
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.2 }
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-6xl mx-auto"
            >
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl font-bold text-slate-800"
                    >
                        Your Projects
                    </motion.h1>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm sm:text-base"
                        >
                            <FiLogOut className="text-lg" />
                            <span>Logout</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setIsModalOpen(true);
                                setProjectName("");
                            }}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md text-sm sm:text-base"
                        >
                            <FiPlus className="text-lg" />
                            <span>New Project</span>
                        </motion.button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full"
                        />
                    </div>
                ) : projects.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-xl shadow-xl p-10 text-center"
                    >
                        <img
                            src="https://placehold.co/300x200/E2E8F0/4A5568?text=No+Projects+Yet"
                            alt="No projects"
                            className="mx-auto mb-6 opacity-70 rounded"
                        />
                        <h2 className="text-2xl font-semibold text-slate-700 mb-2">No projects yet</h2>
                        <p className="text-slate-500 mb-6">Create your first project to get started with collaboration.</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setIsModalOpen(true);
                                setProjectName("");
                            }}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md"
                        >
                            <FiPlus className="text-lg" />
                            <span>Create Project</span>
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ scale: 1.03, y: -5 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                setIsModalOpen(true);
                                setProjectName("");
                            }}
                            className="bg-white flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 cursor-pointer h-64 shadow-sm hover:shadow-lg"
                        >
                            <motion.div
                                whileHover={{ rotate: 90 }}
                                transition={{ duration: 0.2 }}
                                className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4"
                            >
                                <FiPlus className="text-indigo-600 text-3xl" />
                            </motion.div>
                            <h3 className="text-lg font-semibold text-slate-700">New Project</h3>
                            <p className="text-sm text-slate-500 mt-1 text-center">Start a new collaboration</p>
                        </motion.div>

                        {projects.map((project) => (
                            <motion.div
                                key={project._id}
                                variants={itemVariants}
                                whileHover={{ scale: 1.03, y: -5 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate(`/project`, { state: { project } })}
                                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl cursor-pointer h-64 flex flex-col"
                            >
                                <div className={`h-28 ${getRandomColor(project._id)} p-6 relative flex flex-col justify-between`}>
                                    <FiFolder className="text-white/10 text-8xl absolute -right-3 -top-3 rotate-12" />
                                    <div>
                                        <h2 className="text-xl font-bold text-white truncate" title={project.name}>{project.name}</h2>
                                        <p className="text-xs text-white/80 mt-1">Created {new Date(project.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div className="flex items-center text-slate-600 mb-2">
                                        <FiUser className="mr-2 text-slate-400" />
                                        <span className="text-sm">{project.users?.length || 0} Collaborator{(project.users?.length || 0) !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex -space-x-2 overflow-hidden mt-auto">
                                        {project.users?.slice(0, 3).map((userId, i) => (
                                            <div
                                                key={userId || i}
                                                title={userId}
                                                className={`${colors[i % colors.length]} w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium ring-2 ring-white`}
                                            >
                                                {getInitials(userId?.substring(0, 6) || '??')}
                                            </div>
                                        ))}
                                        {project.users?.length > 3 && (
                                            <div className="bg-slate-200 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ring-2 ring-white">
                                                +{project.users.length - 3}
                                            </div>
                                        )}
                                        {(!project.users || project.users.length === 0) && (
                                            <p className="text-xs text-slate-400">No collaborators yet.</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </motion.div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
                        >
                            <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Create New Project</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-indigo-100 hover:text-white"
                                    aria-label="Close modal"
                                >
                                    <FiX className="text-2xl" />
                                </button>
                            </div>
                            <div className="p-6">
                                <form onSubmit={createProject} className="space-y-5">
                                    <div>
                                        <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                                        <input
                                            id="projectName"
                                            onChange={(e) => setProjectName(e.target.value)}
                                            value={projectName}
                                            type="text"
                                            placeholder="Enter project name"
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="button"
                                            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                                            onClick={() => setIsModalOpen(false)}
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
                                        >
                                            Create Project
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
};

export default Home;
