"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Resizable } from "re-resizable";
import "react-resizable/css/styles.css";

export default function IDEPage() {
  const [code, setCode] = useState("");
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [editorWidth, setEditorWidth] = useState("50%");

  const handleAnalyze = () => {
    setOutput("Analyzing code...");
    // Call AI API for analysis (to be implemented)
  };

  const handleOptimize = () => {
    setOutput("Optimizing code...");
    // Call AI API for optimization (to be implemented)
  };

  const handleSendPrompt = () => {
    setOutput("Sending prompt to backend...");
    // Call AI API with prompt (to be implemented)
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
        <div className="flex items-center gap-4">
          <label className="font-bold">Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border rounded-md p-2"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>

        <Editor
          height="500px"
          defaultLanguage={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || "")}
        />

        <textarea
          className="p-2 border rounded-md resize"
          rows={3}
          placeholder="Enter your AI prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        ></textarea>

        <div className="flex gap-4">
          <button
            onClick={handleAnalyze}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Analyze
          </button>
          <button
            onClick={handleOptimize}
            className="bg-green-500 text-white px-4 py-2 rounded-md"
          >
            Optimize
          </button>
          <button
            onClick={handleSendPrompt}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md"
          >
            Send Prompt
          </button>
        </div>
      </Resizable>

      <Resizable
        className="flex-1 border rounded-md bg-gray-100 overflow-auto p-4"
        defaultSize={{ width: "50%", height: "100%" }}
        minWidth="30%"
        maxWidth="70%"
        enable={{ left: true }}
      >
        <h2 className="text-xl font-bold mb-2">Output</h2>
        <div className="overflow-auto h-full">{output || "No output yet"}</div>
      </Resizable>
    </div>
  );
}
