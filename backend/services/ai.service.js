import { GoogleGenerativeAI } from "@google/generative-ai"

// Helper function to create useful code snippets for common file types
function generateBasicCodeForFile(filename, prompt) {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch(extension) {
        case 'js':
            return `// Generated JavaScript file for ${filename}
// Based on prompt: ${prompt}

/**
 * This is a basic implementation based on your request.
 */

// Main functionality
function main() {
  console.log("${filename}");
  
  // Add event listeners if this is for browser
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    // Initialize UI components
    initUI();
  });
}

// Initialize UI elements
function initUI() {
  const app = document.getElementById('app') || document.body;
  app.innerHTML = '<h1>Application</h1><div id="content"></div>';
  
  // Create some basic UI
  const content = document.getElementById('content');
  content.innerHTML = '<p>Content loaded successfully</p>';
}

// Export for module usage
if (typeof module !== 'undefined') {
  module.exports = { main };
}

// Auto-run for browser environments
if (typeof window !== 'undefined') {
  main();`

        case 'jsx':
            return `// Generated React component for ${filename}
// Based on prompt: ${prompt}

import React, { useState, useEffect } from 'react';

/**
 * A React component created based on your request.
 */
const ${filename.replace('.jsx', '')} = ({ title = "Component" }) => {
  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Component lifecycle
  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setData(['Item 1', 'Item 2', 'Item 3']);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Event handlers
  const handleClick = () => {
    alert('Button clicked!');
  };
  
  return (
    <div className="component">
      <h2>{title}</h2>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="content">
          <ul>
            {data.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <button onClick={handleClick}>Click Me</button>
        </div>
      )}
    </div>
  );
};

export default ${filename.replace('.jsx', '')};`

        case 'html':
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${prompt.split(' ').slice(0, 3).join(' ')} - Page</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            width: 90%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #f4f4f4;
            padding: 20px 0;
            margin-bottom: 20px;
        }
        h1 {
            color: #444;
        }
        .content {
            padding: 20px;
            background: #fff;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px 0;
            font-size: 14px;
            color: #777;
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #45a049;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>Welcome to Our Page</h1>
        </div>
    </header>
    
    <div class="container">
        <div class="content">
            <h2>Main Content</h2>
            <p>This is a basic HTML template created for your request. You can customize it further as needed.</p>
            <button id="action-button">Click Me</button>
            <div id="result"></div>
        </div>
    </div>
    
    <footer>
        <div class="container">
            <p>&copy; 2023 My Project. All rights reserved.</p>
        </div>
    </footer>
    
    <script>
        // Basic JavaScript functionality
        document.getElementById('action-button').addEventListener('click', function() {
            document.getElementById('result').textContent = 'Button was clicked!';
        });
    </script>
</body>
</html>`

        case 'css':
            return `/* 
 * Generated CSS for ${filename}
 * Based on prompt: ${prompt}
 */

/* Basic reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* Variables */
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --text-color: #333;
    --background-color: #f8f9fa;
    --spacing-unit: 16px;
    --border-radius: 4px;
    --box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

/* Typography */
body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: var(--text-color);
    background-color: var(--background-color);
    padding: var(--spacing-unit);
}

h1, h2, h3, h4, h5, h6 {
    margin-bottom: var(--spacing-unit);
    font-weight: 700;
}

p {
    margin-bottom: var(--spacing-unit);
}

/* Layout */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-unit);
}

.row {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -var(--spacing-unit);
}

.col {
    flex: 1;
    padding: 0 var(--spacing-unit);
}

/* Components */
.card {
    background: white;
    border-radius: var(--border-radius);
    padding: var(--spacing-unit);
    margin-bottom: var(--spacing-unit);
    box-shadow: var(--box-shadow);
}

.btn {
    display: inline-block;
    background: var(--primary-color);
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    text-decoration: none;
    transition: background 0.3s;
}

.btn:hover {
    background: #2980b9;
}

/* Responsive */
@media (max-width: 768px) {
    .row {
        flex-direction: column;
    }
}`

        case 'json':
            return `{
  "name": "project-name",
  "version": "1.0.0",
  "description": "A project based on your request: ${prompt}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [
    "javascript",
    "node",
    "webapp"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.4.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}`

        // Add more file types as needed
        default:
            return `// Generated code for ${filename}
// Based on prompt: "${prompt}"

// This is a basic implementation. 
// For more specific functionality, try providing a more detailed prompt.

console.log("${filename} loaded successfully");

// Main functionality
function main() {
  console.log("Running ${filename}");
  // Add your code here
}

// Execute main function
main();`
    }
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
        maxOutputTokens: 2048,
    },
    systemInstruction: `You are an expert in MERN and Development. You have an experience of 10 years in the development. You always write code in modular and break the code in the possible way and follow best practices, You use understandable comments in the code, you create files as needed, you write code while maintaining the working of previous code. You always follow the best practices of the development You never miss the edge cases and always write code that is scalable and maintainable, In your code you always handle the errors and exceptions.
    
    Examples: 

    <example>
 
    response: {
    "text": "Here's a simple Express server with a basic Hello World route. I've structured it with a clean separation of concerns.",
    "fileTree": {
        "app.js": {
            "file": {
                "contents": "const express = require('express');\nconst routes = require('./routes/routes.js');\n\nconst app = express();\n\n// Middleware\napp.use(express.json());\n\n// Routes\napp.use(routes);\n\napp.listen(3000, () => {\n    console.log('Server is running on port 3000');\n});"
            }
        },
        "routes/routes.js": {
            "file": {
                "contents": "const express = require('express');\nconst router = express.Router();\n\nrouter.get('/', (req, res) => {\n    res.json({ message: 'Hello World!' });\n});\n\nmodule.exports = router;"
            }
        },
        "package.json": {
            "file": {
                "contents": "{\n    \"name\": \"express-server\",\n    \"version\": \"1.0.0\",\n    \"main\": \"app.js\",\n    \"scripts\": {\n        \"start\": \"node app.js\",\n        \"dev\": \"nodemon app.js\"\n    },\n    \"dependencies\": {\n        \"express\": \"^4.18.2\"\n    },\n    \"devDependencies\": {\n        \"nodemon\": \"^2.0.22\"\n    }\n}"
            }
        }
    },
    "buildCommand": {
        "mainItem": "npm",
        "commands": ["install"]
    },
    "startCommand": {
        "mainItem": "node",
        "commands": ["app.js"]
    }
}

    user: Create an express application 
   
    </example>

    <example>
    user: Help me create a React counter component
    response: {
    "text": "I've created a simple React counter component with increment and decrement functionality. The component uses React hooks for state management.",
    "fileTree": {
        "Counter.jsx": {
            "file": {
                "contents": "import React, { useState } from 'react';\n\nconst Counter = () => {\n    const [count, setCount] = useState(0);\n\n    const increment = () => {\n        setCount(prevCount => prevCount + 1);\n    };\n\n    const decrement = () => {\n        setCount(prevCount => prevCount - 1);\n    };\n\n    return (\n        <div className=\"counter\">\n            <h2>Counter: {count}</h2>\n            <div className=\"buttons\">\n                <button onClick={decrement}>Decrement</button>\n                <button onClick={increment}>Increment</button>\n            </div>\n        </div>\n    );\n};\n\nexport default Counter;"
            }
        }
    }
}
    </example>
    
       <example>
    user: Hello 
    response: {
    "text": "Hello! I'm your AI coding assistant. I can help you with web development tasks like creating React components, Express servers, or full-stack applications. What would you like me to help you with today?"
    }
       </example>
    
    IMPORTANT RULES:
    1. DO NOT use file names with slashes (e.g., routes/index.js). Always create proper directory structures.
    2. All JSON must be strictly valid with double quotes around property names and string values.
    3. Ensure all code in the "contents" property is properly escaped as valid JSON strings.
    4. Each response MUST include a meaningful "text" property with a detailed explanation.
    5. When generating code, make sure the code is complete, valid, and follows best practices.
    6. The fileTree structure must follow the exact format shown in the examples.
    7. Keep your responses concise but complete.
    8. All files should be properly structured with correct indentation.
    `
});

export const generateResult = async (prompt) => {
    try {
        console.log("Processing AI prompt:", prompt);
        
        // Enhance the prompt to guide the model better
        const enhancedPrompt = `Task: ${prompt}\n\nPlease respond with valid JSON containing a 'text' field explaining your solution and a 'fileTree' field with the code implementation if appropriate.`;
        
        // Set a timeout for the API call (30 seconds)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("AI request timed out")), 30000);
        });
        
        // Race the API call against the timeout
        const resultPromise = model.generateContent(enhancedPrompt);
        const result = await Promise.race([resultPromise, timeoutPromise]);
        
        const responseText = result.response.text();
        console.log("Raw AI response:", responseText.substring(0, 500) + "...");
        
        // Try to extract JSON from the response if it's wrapped in markdown or other text
        let jsonText = responseText;
        
        // Check if the response is wrapped in backticks (common with AI responses)
        const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch && jsonBlockMatch[1]) {
            jsonText = jsonBlockMatch[1];
        }
        
        // Validate the response is proper JSON
        try {
            // Try parsing to validate
            const parsedResponse = JSON.parse(jsonText);
            
            // Ensure there's a meaningful text field
            if (!parsedResponse.text || parsedResponse.text.trim() === "" || 
                parsedResponse.text.includes("I've processed your request but couldn't generate")) {
                parsedResponse.text = `Here's a solution for your request: "${prompt}"`;
            }
            
            // Return the validated JSON as a string
            return JSON.stringify(parsedResponse);
        } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            console.log("Attempted to parse:", jsonText);
            
            // Attempt advanced recovery for common JSON errors
            try {
                // 1. Try cleaning up the JSON string
                let fixedJson = jsonText
                    // Fix missing quotes around property names
                    .replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*\:/g, '$1"$2":')
                    // Fix missing quotes around string values
                    .replace(/\:\s*([a-zA-Z0-9_]+)(\,|\})/g, ':"$1"$2')
                    // Remove trailing commas
                    .replace(/,(\s*[\}\]])/g, '$1')
                    // Fix unescaped quotes in strings
                    .replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, function(match) {
                        return match.replace(/(?<!\\)"/g, '\\"');
                    });
                
                // 2. Try to parse the fixed JSON
                const recoveredJson = JSON.parse(fixedJson);
                console.log("Successfully recovered JSON through cleaning");
                
                // Add required fields if missing
                if (!recoveredJson.text) {
                    recoveredJson.text = `Here's the solution for "${prompt}"`;
                }
                
                return JSON.stringify(recoveredJson);
            } catch (recoveryError) {
                console.log("First recovery attempt failed:", recoveryError);
                
                // 3. Try to extract parts of the response with regex
                try {
                    // Extract text content
                    const textMatch = responseText.match(/"text"\s*:\s*"([^"]+)"/);
                    const text = textMatch ? textMatch[1] : `Solution for: ${prompt}`;
                    
                    // Check if there's a fileTree
                    const hasFileTree = responseText.includes('"fileTree"') || responseText.includes('"file"') || 
                                      responseText.includes('"contents"');
                    
                    // Extract and analyze the prompt to determine the appropriate files to generate
                    const lowerPrompt = prompt.toLowerCase();
                    
                    // Determine what kind of files to create based on the prompt
                    const fileTree = {};
                    
                    // Try to find file names mentioned in the response
                    const fileMatches = responseText.match(/"([^"]+\.(?:js|html|css|jsx|ts|tsx|json))"/g);
                    
                    if (fileMatches && fileMatches.length > 0) {
                        fileMatches.forEach(match => {
                            // Extract filename from the match
                            const filename = match.replace(/"/g, '');
                            
                            // Generate working code for this file type
                            const generatedCode = generateBasicCodeForFile(filename, prompt);
                            
                            // Add to fileTree
                            fileTree[filename] = {
                                file: {
                                    contents: generatedCode
                                }
                            };
                        });
                    } else {
                        // No filenames found, create default files based on the prompt
                        if (lowerPrompt.includes('react') || lowerPrompt.includes('component')) {
                            fileTree["Component.jsx"] = {
                                file: {
                                    contents: generateBasicCodeForFile("Component.jsx", prompt)
                                }
                            };
                        } 
                        
                        if (lowerPrompt.includes('express') || lowerPrompt.includes('api') || lowerPrompt.includes('server')) {
                            fileTree["server.js"] = {
                                file: {
                                    contents: generateBasicCodeForFile("server.js", prompt)
                                }
                            };
                            fileTree["package.json"] = {
                                file: {
                                    contents: generateBasicCodeForFile("package.json", prompt)
                                }
                            };
                        }
                        
                        if (lowerPrompt.includes('web') || lowerPrompt.includes('page') || lowerPrompt.includes('site')) {
                            fileTree["index.html"] = {
                                file: {
                                    contents: generateBasicCodeForFile("index.html", prompt)
                                }
                            };
                            fileTree["style.css"] = {
                                file: {
                                    contents: generateBasicCodeForFile("style.css", prompt)
                                }
                            };
                            fileTree["script.js"] = {
                                file: {
                                    contents: generateBasicCodeForFile("script.js", prompt)
                                }
                            };
                        }
                        
                        // If no specific type is detected, create a basic JS file
                        if (Object.keys(fileTree).length === 0) {
                            fileTree["index.js"] = {
                                file: {
                                    contents: generateBasicCodeForFile("index.js", prompt)
                                }
                            };
                        }
                    }
                    
                    // Create a fallback response with the generated fileTree
                    const fallbackResponse = {
                        text: `I've created some starter code based on your request: "${prompt}". Feel free to modify it to better suit your needs.`,
                        fileTree: fileTree
                    };
                    
                    console.log("Created fallback response with functional code");
                    return JSON.stringify(fallbackResponse);
                } catch (extractionError) {
                    console.error("Extraction recovery failed:", extractionError);
                }
            }
            
            // If all recovery attempts fail, return a fallback JSON response with basic code
            return JSON.stringify({
                text: `I've prepared some basic starter code for your request: "${prompt}". This is a simple implementation that you can build upon.`,
                fileTree: createBasicFileTreeFromPrompt(prompt)
            });
        }
    } catch (error) {
        console.error("AI generation error:", error);
        return JSON.stringify({
            text: "I encountered a technical issue while processing your request. I've created some basic starter files for you instead.",
            fileTree: createBasicFileTreeFromPrompt(prompt)
        });
    }
};

// Helper function to create a basic file tree for common requests
function createBasicFileTreeFromPrompt(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    const fileTree = {};
    
    // Create a basic React component
    if (lowerPrompt.includes('react') || lowerPrompt.includes('component')) {
        fileTree["Component.jsx"] = {
            file: {
                contents: generateBasicCodeForFile("Component.jsx", prompt)
            }
        };
        
        // Add index.js if it seems like a full app
        if (lowerPrompt.includes('app') || lowerPrompt.includes('page')) {
            fileTree["index.js"] = {
                file: {
                    contents: `import React from 'react';\nimport ReactDOM from 'react-dom';\nimport Component from './Component';\n\nReactDOM.render(\n  <React.StrictMode>\n    <Component />\n  </React.StrictMode>,\n  document.getElementById('root')\n);`
                }
            };
        }
    }
    
    // Create a basic Express server
    if (lowerPrompt.includes('express') || lowerPrompt.includes('server') || lowerPrompt.includes('api')) {
        fileTree["server.js"] = {
            file: {
                contents: generateBasicCodeForFile("server.js", prompt)
            }
        };
        fileTree["package.json"] = {
            file: {
                contents: generateBasicCodeForFile("package.json", prompt)
            }
        };
    }
    
    // Create a basic web page
    if (lowerPrompt.includes('web') || lowerPrompt.includes('page') || lowerPrompt.includes('site')) {
        fileTree["index.html"] = {
            file: {
                contents: generateBasicCodeForFile("index.html", prompt)
            }
        };
        fileTree["style.css"] = {
            file: {
                contents: generateBasicCodeForFile("style.css", prompt)
            }
        };
        fileTree["script.js"] = {
            file: {
                contents: generateBasicCodeForFile("script.js", prompt)
            }
        };
    }
    
    // If no specific type is detected, create a basic JS file
    if (Object.keys(fileTree).length === 0) {
        fileTree["index.js"] = {
            file: {
                contents: generateBasicCodeForFile("index.js", prompt)
            }
        };
    }
    
    return fileTree;
}