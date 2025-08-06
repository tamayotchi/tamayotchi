import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogPost } from "../types/blog";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "../contexts/ThemeContext";

interface BlogPostPresentationProps {
  post: BlogPost;
}

function BlogPostPresentation({ post }: BlogPostPresentationProps) {
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
          <div className={`p-6 border ${isDarkMode ? "border-gray-700" : "border-gray-300"} mb-6`}>
            <article className="mb-8">
              <header className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">{post.title}</h2>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </header>

              <div className={`prose prose-lg max-w-none ${isDarkMode ? "prose-invert" : ""}`}>
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mt-8 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className={`mb-4 leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 ml-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 ml-4">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className={`mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {children}
                    </li>
                  ),
                  code: ({ inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    
                    if (!inline && match) {
                      const language = match[1];
                      const code = String(children).replace(/\n$/, '');
                      
                      return (
                        <SyntaxHighlighter
                          style={isDarkMode ? oneDark : oneLight}
                          language={language}
                          showLineNumbers={true}
                          customStyle={{
                            margin: '16px 0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                            border: `1px solid ${isDarkMode ? '#374151' : '#d1d5db'}`,
                          }}
                          lineNumberStyle={{
                            color: isDarkMode ? '#6b7280' : '#9ca3af',
                            borderRight: `1px solid ${isDarkMode ? '#374151' : '#d1d5db'}`,
                            paddingRight: '12px',
                            marginRight: '12px',
                            minWidth: '40px',
                            textAlign: 'right',
                          }}
                          wrapLongLines={true}
                        >
                          {code}
                        </SyntaxHighlighter>
                      );
                    }
                    
                    return (
                      <code className={`px-1 py-0.5 rounded text-sm font-mono ${
                        isDarkMode 
                          ? "bg-gray-700 text-blue-300" 
                          : "bg-gray-100 text-red-600"
                      }`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => {
                    return <>{children}</>;
                  },
                  blockquote: ({ children }) => (
                    <blockquote className={`border-l-4 border-blue-500 pl-4 italic mb-4 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
              </div>
            </article>
            
            <div className="text-center">
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

export default BlogPostPresentation;
