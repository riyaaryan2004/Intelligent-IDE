//app/page.tsx
"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { CircuitBoard, Cpu, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect ,useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      setIsLoggedIn(true); // Store the login state
    }
  }, []);
  const handleGetStarted = () => {
    // Check for authorization header (this is a simplified example)
    const isAuthorized = localStorage.getItem("authToken");
    if (isAuthorized) {
      // Redirect to IDE page
      router.push("/ide");
    } else {
      // Redirect to signup page
      router.push("/signup");
    }
  };

  // Prevent hydration errors
  useEffect(() => {
    // Any client-side only code can go here
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Cpu className="w-8 h-8 text-blue-500" />
          <span className="text-2xl font-bold">Intelligent IDE</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Intelligent IDE</h1>
        <p className="text-xl mb-8 max-w-2xl">
          Experience the future of coding with my AI-integrated development
          environment. Boost your productivity and unleash your creativity.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <FeatureCard
            icon={<Cpu className="w-12 h-12 text-purple-400" />}
            title="Generation"
            description="The IDE has prompts to generate code fast and optimised."
          />
          <FeatureCard
            icon={<Zap className="w-12 h-12 text-yellow-400" />}
            title="AI-Powered Assistance"
            description="Get intelligent code recommendations and improvements."
          />
          <FeatureCard
            icon={<CircuitBoard className="w-12 h-12 text-green-400" />}
            title="Smart Debugging"
            description="Identify and fix bugs faster."
          />
        </div>
        <Button size="lg" onClick={handleGetStarted}>
          Get Started
        </Button>
      </main>

      <footer className="p-4 text-center text-gray-400">
        made with 🧠 by Riya Aryan
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg flex flex-col items-center">
      {icon}
      <h2 className="text-xl font-semibold mt-4 mb-2">{title}</h2>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}
