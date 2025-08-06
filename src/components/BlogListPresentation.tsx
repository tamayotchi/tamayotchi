import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogMetadata } from "../types/blog";
import { useTheme } from "../contexts/ThemeContext";

interface BlogListPresentationProps {
  posts: BlogMetadata[];
}

function BlogListPresentation({ posts }: BlogListPresentationProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div
      className={`font-mono ${
        isDarkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-800"
      } min-h-screen transition-colors duration-300 relative`}
    >
      <div
        className={`absolute inset-0 ${
          isDarkMode ? "opacity-10" : "opacity-5"
        }`}
        style={{
          backgroundImage: `
            linear-gradient(to right, ${
              isDarkMode ? "#374151" : "#9CA3AF"
            } 1px, transparent 1px),
            linear-gradient(to bottom, ${
              isDarkMode ? "#374151" : "#9CA3AF"
            } 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />
      <div className="max-w-4xl mx-auto p-2 sm:p-4 relative z-10">
        <div
          className={`border ${isDarkMode ? "border-gray-700" : "border-gray-300"} p-4`}
        >
          <header className="mb-8 relative">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-0 right-0"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
            <h1 className="text-2xl font-bold mb-2">
              <Link to="/" className="hover:text-blue-400 transition-colors">
                TAMAYOTCHI
              </Link>
            </h1>
            <p className="mb-4"></p>
          </header>
        <main>
          <div className={`p-6 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"} rounded-lg`}>
            <h2 className="text-xl font-bold mb-6 text-center">BLOG POSTS</h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <article 
                  key={post.slug} 
                  className={`border rounded-lg p-6 ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}
                >
                  <h3 className="text-xl font-bold mb-2">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className={`leading-relaxed mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {post.excerpt}
                  </p>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Read more →
                  </Link>
                </article>
              ))}
            </div>
            
            <div className="text-center mt-6">
              <Link
                to="/"
                className="text-blue-400 hover:text-blue-300 underline font-medium"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}

export default BlogListPresentation;
