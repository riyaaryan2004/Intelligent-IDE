//app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { NextRouter } from "next/router";
import Link from "next/link";

// Icons
import { LogOut, Trash2, Lock, Eye, User, FileCode, Folder, ExternalLink, Code, Search } from "lucide-react";

// Types
interface User {
  _id: string;
  username: string;
  email: string;
}

interface Collaborator {
  user: User;
  role: string;
  _id: string;
}
  
interface Project {
  _id: string;
  name: string;
  description: string;
  owner: User;
  language: string;
  codeSnippets: any[]; // Modify based on actual structure
  testCases: any[]; // Modify based on actual structure
  settings: Record<string, any>; // Replace 'any' if settings have a fixed structure
  collaborators: Collaborator[];
  createdAt: string; // Consider converting to Date type if needed
  updatedAt: string;
  __v: number;
}


const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [newProject, setNewProject] = useState<{ name: string; description: string; language: string }>({
    name: "",
    description: "",
    language: "javascript",
  });
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);

  const backendURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  // Function to get headers with auth token
  const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Handle logout
  const handleLogout = () => {
    // Remove auth token from localStorage
    localStorage.removeItem("authToken");
    
    // Redirect to signup page
    router.push("/signup");
  };

  // Get language icon
  const getLanguageIcon = (language: string) => {
    switch (language?.toLowerCase()) {
      case "javascript":
        return "📄 JS";
      case "typescript":
        return "📄 TS";
      case "python":
        return "🐍 PY";
      case "java":
        return "☕ JAVA";
      case "cpp":
      case "c++":
        return "⚙️ C++";
      case "css":
        return "🎨 CSS";
      case "html":
        return "🌐 HTML";
      default:
        return "📄 Code";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Fetch user and project data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const userResponse = await fetch(`${backendURL}/api/auth/me`, { headers: getHeaders() });
        if (!userResponse.ok) throw new Error("Failed to fetch user data");
        const userData = await userResponse.json();
        setUser(userData.data?.user ?? null);

        const projectsResponse = await fetch(`${backendURL}/api/projects`, { headers: getHeaders() });
        if (!projectsResponse.ok) throw new Error("Failed to fetch projects");
        const projectsData = await projectsResponse.json();
        const projectsList = projectsData?.data?.projects?.projects || [];
        setProjects(projectsList);
    
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Create new project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProject.name || !newProject.description) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const response = await fetch(`${backendURL}/api/projects/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(newProject),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();
      const project = data.data?.project;
      if (project && project._id && project.name) {
        setProjects([{ ...project, files: [] }, ...projects]);
      }
      setIsNewProjectModalOpen(false);
      setNewProject({ name: "", description: "", language: "javascript" });
    } catch (err) {
      console.error("Error creating project:", err);
      alert(`Failed to create project: ${err instanceof Error ? err.message : "An unknown error occurred"}`);
    }
  };

  const handleOpenInIDE =async (project: Project) => {

  const fileData = {
    fileId: project._id,
    fileName: project.name,
    language: project.language, // Include programming language
    lastOpened: new Date().toISOString(),
    codeSnippets: project.codeSnippets || [],
    latestCode:""
  };

  try {
    if (project.codeSnippets && project.codeSnippets.length > 0) {
      const lastSnippetId = project.codeSnippets[project.codeSnippets.length - 1];
            const response = await fetch(`${backendURL}/api/code/snippet/${lastSnippetId}`, {
        headers: getHeaders()
      });
      
      if (response.ok) {
        const res = await response.json();
        // Add latest code to the fileData
        if (res && res.data && res.data.snippet &&res.data.snippet.code) {
          fileData.latestCode = res.data.snippet.code;
        }
        console.log("code: ",res.data.snippet.code);
      } else {
        console.error("Failed to fetch latest code snippet");
        fileData.latestCode="//failed to fetch older code";
      }
    }
    console.log("Saved to localStorage:", fileData);

  } catch (error) {
    console.error("Error fetching latest code snippet:", error);
    // Continue with navigation even if fetch fails
  }
  

  localStorage.setItem('currentFileData', JSON.stringify(fileData));
  
  // Navigate to the IDE page with query parameters for the specific file
  router.push(`/ide?projectId=${project._id}&fileName=${encodeURIComponent(project.name)}`);
};

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const response = await fetch(`${backendURL}/api/projects/${id}`, {
          method: "DELETE",
          headers: getHeaders(),
        });

        if (!response.ok) {
          throw new Error("Failed to delete project");
        }

        setProjects((prevProjects) => prevProjects.filter((project) => project._id !== id));
        if (selectedProject && selectedProject._id === id) {
          setSelectedProject(null);
        }
      } catch (err) {
        console.error("Error deleting project:", err);
        alert(`Failed to delete project: ${err instanceof Error ? err.message : "An unknown error occurred"}`);
      }
    }
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            {user && <p className="text-gray-600 dark:text-gray-400">Welcome, {user.username}!</p>}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                type="text"
                placeholder="Search Files..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsNewProjectModalOpen(true)}>
              Create File
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="flex items-center bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project List */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Files</h2>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {searchQuery ? "No matching projects found" : "No projects yet"}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredProjects.map((project) => (
                  <li
                    key={project._id}
                    className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${selectedProject?._id === project._id
                        ? "bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded p-1 mr-3 text-xs">
                        {getLanguageIcon(project.language)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Updated: {formatDate(project.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenInIDE(project);
                        }}
                        title="Open in IDE"
                      >
                        <Code className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project._id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>


        </div>
      </div>

      {/* Create Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New File</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="My File"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  type="text"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="File description"
                  required
                />
              </div>

              <div>
                <Label htmlFor="language">Primary Language</Label>
                <select
                  id="language"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newProject.language}
                  onChange={(e) => setNewProject({ ...newProject, language: e.target.value })}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewProjectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create File</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;