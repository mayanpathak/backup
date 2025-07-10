import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, MessageSquare, Users, Lock, FolderPlus, UserPlus, Zap, Moon, Sun, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user.context';
import axios from '../config/axios';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    setIsVisible(true);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    if (isDarkMode) {
      // Switch to light mode
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      // Switch to dark mode
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const slideUp = {
    hidden: { y: 60, opacity: 0 },
    visible: i => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  const slideRight = {
    hidden: { x: -60, opacity: 0 },
    visible: i => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    })
  };

  const featureCards = [
    {
      icon: <Code size={32} />,
      title: "AI-Assisted Coding",
      description: "Get intelligent code suggestions and automate repetitive tasks with AI assistance."
    },
    {
      icon: <MessageSquare size={32} />,
      title: "Real-time Chat",
      description: "Communicate instantly with team members through Redis-powered real-time messaging."
    },
    {
      icon: <Users size={32} />,
      title: "Smooth Collaboration",
      description: "Work together seamlessly on shared projects with intuitive collaboration tools."
    },
    {
      icon: <Lock size={32} />,
      title: "Secure Authentication",
      description: "Keep your projects safe with our robust authentication system."
    },
    {
      icon: <FolderPlus size={32} />,
      title: "Project Management",
      description: "Create and manage multiple projects with powerful organization tools."
    },
    {
      icon: <UserPlus size={32} />,
      title: "Easy Team Building",
      description: "Invite collaborators with a simple link and assign custom permissions."
    },
    {
      icon: <Zap size={32} />,
      title: "Modern Architecture",
      description: "Enjoy lightning-fast performance with our optimized full-stack architecture."
    }
  ];

  const techStack = [
    { name: "React.js", color: "#61DAFB" },
    { name: "Node.js", color: "#68A063" },
    { name: "Redis", color: "#DC382D" },
    { name: "MongoDB", color: "#13AA52" },
    { name: "Framer Motion", color: "#0055FF" },
    { name: "Express.js", color: "#000000" }
  ];

  const howItWorks = [
    {
      title: "Sign Up",
      description: "Create your account in seconds and set up your developer profile.",
      color: "from-gray-700 to-gray-900"
    },
    {
      title: "Create Project",
      description: "Start a new project with our intuitive project creation wizard.",
      color: "from-gray-600 to-gray-800"
    },
    {
      title: "Invite Team",
      description: "Add collaborators and assign roles with custom permissions.",
      color: "from-gray-500 to-gray-700"
    },
    {
      title: "Code & Collaborate",
      description: "Work together in real-time with AI assistance and instant feedback.",
      color: "from-gray-400 to-gray-600"
    }
  ];

  // Handle logout
  const handleLogout = async () => {
    try {
      await axios.get('/users/logout');
      clearUser();
      // No need to navigate since we're already on the landing page
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server request fails, proceed with logout on client
      clearUser();
    }
  };

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      {/* Header/Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`fixed w-full px-6 py-4 flex justify-between items-center z-50 shadow-sm ${isDarkMode ? 'bg-gray-800 bg-opacity-80 backdrop-blur-md' : 'bg-white bg-opacity-80 backdrop-blur-md'} transition-colors duration-300`}
      >
        <motion.div 
          className={`font-bold text-2xl flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Code className="mr-2" />
          CodeCollab
        </motion.div>
        <div className="flex gap-4 items-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-700'} transition-colors duration-300`}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          
          {user ? (
            <div className="flex gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/home')}
                className={`px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-black text-white'}`}
              >
                My Projects
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <LogOut size={16} />
                Logout
              </motion.button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg transition-all ${isDarkMode ? 'text-white border border-gray-600 hover:bg-gray-700' : 'text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                >
                  Login
                </motion.button>
              </Link>
              <Link to="/register">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-black text-white'}`}
                >
                  Sign Up
                </motion.button>
              </Link>
            </>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="pt-32 pb-20 px-6 md:px-12 lg:px-24 flex flex-col md:flex-row items-center justify-between"
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={fadeIn}
      >
        <motion.div 
          className="w-full md:w-1/2 mb-12 md:mb-0"
          variants={slideRight}
          custom={0}
        >
          <motion.h1 
            className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            variants={slideRight}
            custom={1}
          >
            Collaborate on Code <br />
            <span className={`bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-500' : 'bg-gradient-to-r from-gray-700 to-gray-900'}`}>With AI Superpowers</span>
          </motion.h1>
          <motion.p 
            className={`text-xl mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
            variants={slideRight}
            custom={2}
          >
            Build, share, and collaborate on projects in real-time with powerful AI assistance.
          </motion.p>
          <motion.div 
            className="flex gap-4"
            variants={slideRight}
            custom={3}
          >
            {user ? (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/home')}
                className={`px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-lg font-medium ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-black text-white'}`}
              >
                Go to My Projects
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all text-lg font-medium ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-black text-white'}`}
              >
                Get Started Free
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg transition-all text-lg font-medium ${isDarkMode ? 'border border-gray-600 text-gray-300 hover:bg-gray-800' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              See Demo
            </motion.button>
          </motion.div>
        </motion.div>
        <motion.div 
          className="w-full md:w-1/2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="relative">
            <div className="w-full h-96 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-100 to-gray-300">
              <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-30 rounded-2xl p-6">
                <div className="h-6 w-full flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex h-5/6">
                  <div className="w-1/4 bg-gray-900 h-full rounded-l-lg p-4">
                    <div className="bg-gray-800 h-8 w-full rounded-md mb-3"></div>
                    <div className="bg-gray-800 h-8 w-full rounded-md mb-3"></div>
                    <div className="bg-gray-800 h-8 w-full rounded-md"></div>
                  </div>
                  <div className="w-2/4 bg-gray-800 h-full p-4">
                    <div className="flex mb-2">
                      <div className="bg-blue-500 h-3 w-12 rounded mr-2"></div>
                      <div className="bg-purple-500 h-3 w-16 rounded mr-2"></div>
                      <div className="bg-green-500 h-3 w-10 rounded"></div>
                    </div>
                    <div className="h-4 bg-gray-700 w-full rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 w-5/6 rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 w-4/6 rounded mb-4"></div>
                    <div className="flex mb-2">
                      <div className="bg-yellow-500 h-3 w-14 rounded mr-2"></div>
                      <div className="bg-red-500 h-3 w-10 rounded"></div>
                    </div>
                    <div className="h-4 bg-gray-700 w-full rounded mb-2"></div>
                    <div className="h-4 bg-gray-700 w-3/6 rounded"></div>
                  </div>
                  <div className="w-1/4 bg-gray-700 h-full rounded-r-lg p-4">
                    <div className="bg-gray-600 h-full w-full rounded-md"></div>
                  </div>
                </div>
              </div>
            </div>
            <motion.div 
              className={`absolute -bottom-4 -right-4 p-4 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-yellow-500" />
                <span className="text-sm font-medium">AI suggestions active</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.section>

      {/* Feature Highlights */}
      <section className={`py-20 px-6 md:px-12 lg:px-24 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors duration-300`}>
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Everything You Need to Build & Collaborate
          </h2>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Powerful features designed to streamline your development workflow and enhance team productivity.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureCards.map((feature, index) => (
            <motion.div
              key={index}
              className={`rounded-xl p-6 shadow-md hover:shadow-xl transition-all ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <motion.div 
                className={`rounded-full w-16 h-16 flex items-center justify-center mb-6 ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
                whileHover={{ 
                  scale: 1.1, 
                  boxShadow: "0px 0px 8px rgba(0,0,0,0.2)",
                  backgroundColor: isDarkMode ? "#4B5563" : "#f7f7f7" 
                }}
              >
                {feature.icon}
              </motion.div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{feature.title}</h3>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className={`py-20 px-6 md:px-12 lg:px-24 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            How It Works
          </h2>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Get started in minutes and transform your development workflow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((step, index) => (
            <motion.div
              key={index}
              className={`rounded-xl overflow-hidden shadow-lg bg-gradient-to-br ${step.color} text-white p-6 relative`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -10, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }}
            >
              <div className="text-5xl font-bold opacity-10 absolute top-4 right-4">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold mb-4">{step.title}</h3>
              <p className="text-gray-100">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonial/CTA Section */}
      <motion.section 
        className={`py-20 px-6 md:px-12 lg:px-24 text-white text-center ${isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-gray-900 to-black'}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Development Workflow?</h2>
          <p className="text-xl mb-8 text-gray-300">
            Join thousands of developers who are building better software, faster.
          </p>
          {user ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/home')}
              className={`px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all text-lg font-medium ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'}`}
            >
              Go to My Projects
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all text-lg font-medium ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'}`}
            >
              Start Building For Free
            </motion.button>
          )}
        </motion.div>
      </motion.section>

      {/* Tech Stack */}
      <section className={`py-16 px-6 md:px-12 lg:px-24 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors duration-300`}>
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Powered By Modern Technology</h3>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Our platform is built with the latest and greatest tech stack</p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6">
          {techStack.map((tech, index) => (
            <motion.div
              key={index}
              className={`px-6 py-4 rounded-lg shadow-sm flex items-center ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -5, boxShadow: "0px 4px 12px rgba(0,0,0,0.1)" }}
            >
              <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: tech.color }}></div>
              <span className="font-medium">{tech.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-6 md:px-12 lg:px-24 border-t ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-200'} transition-colors duration-300`}>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.div 
            className={`font-bold text-xl flex items-center mb-6 md:mb-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            whileHover={{ scale: 1.05 }}
          >
            <Code className="mr-2" />
            CodeCollab
          </motion.div>
            
          <div className={`flex gap-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <motion.a href="#" whileHover={{ scale: 1.1 }} className={isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'}>About</motion.a>
            <motion.a href="#" whileHover={{ scale: 1.1 }} className={isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'}>Features</motion.a>
            <motion.a href="#" whileHover={{ scale: 1.1 }} className={isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'}>Pricing</motion.a>
            <motion.a href="#" whileHover={{ scale: 1.1 }} className={isDarkMode ? 'hover:text-white' : 'hover:text-gray-900'}>Contact</motion.a>
          </div>
        </div>
        <div className={`mt-8 pt-8 border-t text-center text-sm ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
          © {new Date().getFullYear()} CodeCollab. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;




