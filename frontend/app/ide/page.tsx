//app/ide/page.tsx
"use client";
import { useState, useRef,useEffect } from "react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor"; // Import Monaco types
import { Resizable } from "re-resizable";
import "react-resizable/css/styles.css";
import { useRouter } from "next/navigation";

export default function IDEPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("");
  const [editorWidth, setEditorWidth] = useState("50%");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("output"); // "output" or "testcases"
  const [testCases, setTestCases] = useState("");  const [generatedCode, setGeneratedCode] = useState("");
  const [showCodeCard, setShowCodeCard] = useState(false);
  const [cardZoom, setCardZoom] = useState(1);
  
  // File/project management state
  const [currentFileName, setCurrentFileName] = useState<string>("Untitled.js");
  const [projectId, setProjectId] = useState<string | null>(null);
 
  const mainEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const token1 = localStorage.getItem("authToken");
  console.log("hii",token1);
  
  useEffect(() => {
    const savedData = localStorage.getItem("currentFileData");
    console.log("Retrieved from localStorage:", savedData); // Debugging

    if (savedData) {
      const projectData = JSON.parse(savedData);
      setProjectId(projectData.fileId);
      setCurrentFileName(projectData.fileName);
      setLanguage(projectData.language);
      setCode(projectData.latestCode); 

      if (projectData.testCases) {
        setTestCases(Array.isArray(projectData.testCases) 
          ? projectData.testCases.join("\n") 
          : projectData.testCases);
      }
    }
  }, []);
  
  // Headers for API requests
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    };
  };

  // Handle errors
  const handleError = (error: unknown) => {
    console.error("API Error:", error);
    setOutput(`Error: ${error instanceof Error ? error.message : "An unknown error occurred"}`);
    setIsLoading(false);
  };

  const handleViewAllFiles = () => {
      router.push("/dashboard");
  };
 
// Add this function to handle test case changes
const handleTestCasesChange = (value: string | undefined) => {
  setTestCases(value || "");
  // Save test cases in localStorage
  const savedData = localStorage.getItem("currentFileData");
  if (savedData && projectId) {
    const projectData = JSON.parse(savedData);
    projectData.testCases = value || "";
    localStorage.setItem("currentFileData", JSON.stringify(projectData));
  }

};

const handleRunTests = () => {
  if (!testCases || !code) {
    setOutput("Please add both code and test cases to run tests.");
    setActiveTab("output");
    return;
  }

  setIsLoading(true);
  setOutput("Running tests...");
  setActiveTab("output");

  setTimeout(() => {
    setIsLoading(false);
  }, 2000);
};
  const handleRunCode = async () => {
    setIsLoading(true);
    setOutput("Running code...");
    setShowCodeCard(false);

    try {
      const url =
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key":
            "bbbfed5fb3mshbc59fa3b01a2246p15e921jsn6eaebf2fc9bc", // Replace with your actual API key
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
        },
        body: JSON.stringify({
          source_code: code,
          language_id:
                language === "cpp" ? 54  
              : language === "python" ? 71  
              : language === "java" ? 62  
              : language === "javascript" ? 63  
              : null ,
          stdin: testCases, //take input from run test case
        }),
      };

      const response = await fetch(url, options);

      if (!response.ok)
        throw new Error(`Error ${response.status}: ${response.statusText}`);

      const result = await response.json();
      setOutput(result.stdout || result.stderr || "No output");
    } catch (error) {
      setOutput(
        `Execution error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateCode = async () => {
    if (!prompt) {
      setOutput("Please enter a prompt first.");
      return;
    }

    setIsLoading(true);
    setOutput("Generating code...");
    setShowCodeCard(false);

    try {
      const response = await fetch(`${backendURL}/api/code/generate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          prompt,
          language,
          projectId, 
          context: "None"
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === "success" && data.data?.snippet) {
        const codeResult = data.data.snippet.code || "";
      setGeneratedCode(codeResult);
      const analysisData = data.data.snippet.analysis || data.data.analysis || {};
      const testsData = data.data.tests || {};
      
      setOutput(`Code generated successfully! Check the code card below.`);
      setShowCodeCard(true);
      } else {
        setOutput(`Error: ${data.message || "Failed to generate code"}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
          console.error("Error in handleGenerateCode:", error);
          setOutput(`Error: ${error.message}`);
      } else {
          setOutput("An unexpected error occurred.");
      } } finally {
      setIsLoading(false);
  }
  };

  const handleAnalyze = async () => {
    if (!code) {
      setOutput("Please enter some code to analyze.");
      return;
    }

    setIsLoading(true);
    setOutput("Analyzing code...");
    setShowCodeCard(false);

    try {
      const response = await fetch(`${backendURL}/code/analyze`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          code,
          language
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === "success" && data.data) {
        // Format the analysis results
        const analysis = data.data.analysis;
        let formattedOutput = "Code Analysis Results:\n\n";
        
        if (analysis.improvements && analysis.improvements.length) {
          formattedOutput += "Improvements:\n";
          analysis.improvements.forEach((item: any, index: number) => {
            formattedOutput += `${index + 1}. ${item}\n`;
          });
          formattedOutput += "\n";
        }
        
        if (analysis.bugs && analysis.bugs.length) {
          formattedOutput += "Potential Bugs:\n";
          analysis.bugs.forEach((item: any, index: number) => {
            formattedOutput += `${index + 1}. ${item}\n`;
          });
          formattedOutput += "\n";
        }
        
        if (analysis.securityIssues && analysis.securityIssues.length) {
          formattedOutput += "Security Issues:\n";
          analysis.securityIssues.forEach((item: any, index: number) => {
            formattedOutput += `${index + 1}. ${item}\n`;
          });
          formattedOutput += "\n";
        }
        
        if (analysis.recommendations && analysis.recommendations.length) {
          formattedOutput += "Recommendations:\n";
          analysis.recommendations.forEach((item: any, index: number) => {
            formattedOutput += `${index + 1}. ${item}\n`;
          });
        }
        
        setOutput(formattedOutput);
      } else {
        setOutput(`Error: ${data.message || "Failed to analyze code"}`);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!code) {
      setOutput("Please enter some code to optimize.");
      return;
    }

    setIsLoading(true);
    setOutput("Optimizing code...");
    setShowCodeCard(false);

    try {
      const response = await fetch(`${backendURL}/code/optimize`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          code,
          language,
          requirements: [] // Optional requirements for optimization
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === "success" && data.data) {
        // Get the optimized code
        const optimizedCode = data.data.optimized?.code || data.data.optimized || "";
        
        // Set the optimized code in state
        setGeneratedCode(optimizedCode);
        
        // Show optimization summary
        let summary = "Code Optimization Results:\n\n";
        summary += "✅ Code has been optimized successfully!\n\n";
        
        if (data.data.improvements) {
          summary += "Improvements Made:\n";
          
          if (data.data.improvements.performance) {
            summary += "Performance:\n";
            data.data.improvements.performance.forEach((item: any, i: any) => {
              summary += `- ${item}\n`;
            });
          }
          
          if (data.data.improvements.readability) {
            summary += "\nReadability:\n";
            data.data.improvements.readability.forEach((item: any, i: any) => {
              summary += `- ${item}\n`;
            });
          }
        }
        
        setOutput(summary);
        setShowCodeCard(true);
      } else {
        setOutput(`Error: ${data.message || "Failed to optimize code"}`);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebug = async () => {
    if (!code) {
      setOutput("Please enter some code to debug.");
      return;
    }

    setIsLoading(true);
    setOutput("Debugging code...");
    setShowCodeCard(false);

    try {
      const response = await fetch(`${backendURL}/debug/analyze`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          code,
          language
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === "success" && data.data) {
        // Format the debug results
        const analysis = data.data.analysis;
        let formattedOutput = "Debug Results:\n\n";
        
        if (analysis.potentialBugs) {
          formattedOutput += "Potential Bugs:\n";
          Object.entries(analysis.potentialBugs).forEach(([category, bugs]) => {
            formattedOutput += `${category}:\n`;
            (bugs as string[]).forEach((bug: any, i: any) => {
              formattedOutput += `- ${bug}\n`;
            });
            formattedOutput += "\n";
          });
        }
        
        if (analysis.suggestions && analysis.suggestions.length) {
          formattedOutput += "Suggestions:\n";
          analysis.suggestions.forEach((item: any, index: number) => {
            formattedOutput += `${index + 1}. ${item}\n`;
          });
        }
        
        setOutput(formattedOutput);
      } else {
        setOutput(`Error: ${data.message || "Failed to debug code"}`);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeCode = () => {
    if (generatedCode) {
      setCode(prevCode => {
        // If there's existing code, add a separator
        if (prevCode.trim()) {
          return `${prevCode}\n\n// Generated code merged from output\n${generatedCode}`;
        }
        return generatedCode;
      });
      setOutput("Code merged successfully!");
      setShowCodeCard(false);
    }
  };

  const handleReplaceCode = () => {
    if (generatedCode) {
      setCode(generatedCode);
      setOutput("Code replaced successfully!");
      setShowCodeCard(false);
    }
  };

  const handleZoomIn = () => {
    setCardZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setCardZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setCardZoom(1);
  };

  return (
    <div className="flex h-screen p-4 gap-4 flex-row">
      <Resizable
        className="flex flex-col gap-4 border-r pr-4"
        size={{ width: editorWidth, height: "100%" }}
        minWidth="30%"
        maxWidth="70%"
        enable={{ right: true }}
        onResizeStop={(event, direction, ref, delta) =>
          setEditorWidth(ref.style.width)
        }
      >
        <div className="flex items-center justify-between gap-2">
        {/* File info display */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-sm truncate max-w-[200px]">
            {currentFileName || "Untitled"}
          </span>
          <span className="text-xs text-gray-500">{projectId ? `(Project: ${projectId.slice(0, 8)}...)` : ""}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            //onClick={handleSaveFile}
            className="bg-gray-600 text-white px-3 py-1 rounded-md flex items-center text-sm"
            title="Save"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
            </svg>
            Save
          </button>
        </div>
      </div>

        <div className="flex items-center gap-9">
          <div>
            <label className="font-bold ">Language: </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border rounded-md p-2 text-slate-700"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
          <div className="">
            <div className="flex items-center gap-3">
            <button
            onClick={handleViewAllFiles}
            className="bg-gray-600 text-white px-3 py-2 rounded-md flex items-center"
            title="View All Files"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            Files
            </button>
              <button
                onClick={handleRunCode}
                className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Run
              </button>
              <button
                onClick={handleDebug}
                className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Debug
              </button>
            </div>
          </div>
        </div>

        <Editor
          height="500px"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || "")}
          onMount={(editor) => (mainEditorRef.current = editor)}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true
          }}
        />

        <textarea
          className="p-2 border rounded-md resize text-slate-700"
          rows={3}
          placeholder="Enter your AI prompt here (e.g., 'Create a function to sort an array of objects by multiple properties')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>

        <div className="flex gap-4">
          <button
            onClick={handleGenerateCode}
            className="bg-purple-500 text-white px-4 py-2 rounded-md flex items-center"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Code'}
          </button>
          <button
            onClick={handleAnalyze}
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
          <button
            onClick={handleOptimize}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md flex items-center"
            disabled={isLoading}
          >
            {isLoading ? 'Optimizing...' : 'Optimize'}
          </button>
        </div>
      </Resizable>

      <Resizable
        className="flex-1 border rounded-md bg-zinc-800 overflow-auto p-4 flex flex-col"
        defaultSize={{ width: "50%", height: "100%" }}
        minWidth="30%"
        maxWidth="70%"
        enable={{ left: true }}
      >
        {/* Tab navigation */}
        <div className="flex border-b border-zinc-700 mb-2  gap-5">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === "output"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("output")}
          >
            Output
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === "testcases"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("testcases")}
          >
            Test Cases
          </button>
        </div>

        {/* Conditional rendering based on active tab */}
        {activeTab === "output" ? (
          <>
            <h2 className="text-xl font-bold mb-2 text-white">Output</h2>
            <pre className="overflow-auto flex-grow bg-zinc-900 text-white p-4 rounded-md whitespace-pre-wrap">
              {isLoading ? "Loading..." : output || "No output yet"}
            </pre>
            
            {showCodeCard && (
              <div className="mt-4">
                <div 
                  className="bg-zinc-700 rounded-md p-3 border border-zinc-600 transition-all"
                  style={{ transform: `scale(${cardZoom})`, transformOrigin: 'top left' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-bold">Generated Code</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleZoomOut} 
                        className="bg-zinc-600 text-white px-2 py-1 rounded hover:bg-zinc-500"
                        title="Zoom Out"
                      >
                        −
                      </button>
                      <button 
                        onClick={handleZoomReset} 
                        className="bg-zinc-600 text-white px-2 py-1 rounded hover:bg-zinc-500"
                        title="Reset Zoom"
                      >
                        ↺
                      </button>
                      <button 
                        onClick={handleZoomIn} 
                        className="bg-zinc-600 text-white px-2 py-1 rounded hover:bg-zinc-500"
                        title="Zoom In"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-80 mb-2">
                    <Editor
                      height="100%"
                      language={language}
                      theme="vs-dark"
                      value={generatedCode}
                      onChange={(value) => setGeneratedCode(value || "")}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        readOnly: false,
                        automaticLayout: true
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleMergeCode}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm9 4a1 1 0 10-2 0v6a1 1 0 102 0V7zm-3 2a1 1 0 10-2 0v4a1 1 0 102 0V9zm-3 3a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" />
                      </svg>
                      Merge
                    </button>
                    <button
                      onClick={handleReplaceCode}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0
                        11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 
                        011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 
                        1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Replace
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-white">Test Cases</h2>
              <button
                onClick={handleRunCode}
                className="bg-green-600 text-white px-3 py-1 rounded-md flex items-center text-sm"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Run Tests
              </button>
            </div>
            <div className="flex-grow bg-zinc-900 rounded-md overflow-hidden">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={testCases}
                onChange={(value) => handleTestCasesChange(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  automaticLayout: true
                }}
              />
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Write your test cases here. Each test case should be separated by a new line.
            </p>
          </>
        )}
      </Resizable>
    </div>
  );
}