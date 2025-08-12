// Type definitions for the application

// Step types
export const StepType = {
  CreateFile: 'CreateFile',
  RunScript: 'RunScript',
  CreateFolder: 'CreateFolder'
};

// These are just for documentation purposes in JavaScript
// In a real TypeScript project, these would be proper interfaces

/**
 * @typedef {Object} Step
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} status - 'pending' | 'in-progress' | 'completed'
 * @property {string} type - One of StepType values
 * @property {string} [path] - File path for CreateFile steps
 * @property {string} [code] - Code content for CreateFile steps
 */

/**
 * @typedef {Object} FileItem
 * @property {string} name
 * @property {string} path
 * @property {'file' | 'folder'} type
 * @property {string} [content] - File content
 * @property {FileItem[]} [children] - Child items for folders
 * @property {number} [size] - File size in bytes
 */

// Export empty objects for imports (since we're using JSDoc for types)
export const Step = {};
export const FileItem = {};
