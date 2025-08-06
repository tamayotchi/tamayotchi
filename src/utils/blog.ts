import { BlogPost, BlogMetadata } from "../types/blog";

const blogPosts: Record<string, string> = import.meta.glob(
  "/src/data/blog/*.md",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
);

// Cache for parsed frontmatter
const frontmatterCache = new Map<
  string,
  { data: FrontmatterData; content: string }
>();

interface FrontmatterData {
  title?: string;
  date?: string;
  excerpt?: string;
  slug?: string;
}

function parseFrontmatter(content: string): {
  data: FrontmatterData;
  content: string;
} {
  // Check cache first
  if (frontmatterCache.has(content)) {
    return frontmatterCache.get(content)!;
  }

  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    const result = { data: {}, content };
    frontmatterCache.set(content, result);
    return result;
  }

  const frontmatterText = match[1];
  const markdownContent = match[2];

  const data: FrontmatterData = {};
  const lines = frontmatterText.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      (data as any)[key] = value;
    }
  }

  const result = { data, content: markdownContent };
  frontmatterCache.set(content, result);
  return result;
}

export function getAllBlogPosts(): BlogMetadata[] {
  const posts = Object.entries(blogPosts).map(([path, content]) => {
    const { data } = parseFrontmatter(content);
    const filename = path.split("/").pop()?.replace(".md", "") || "";

    return {
      title: data.title || "Untitled",
      date: data.date || new Date().toISOString().split("T")[0],
      excerpt: data.excerpt || "No excerpt available",
      slug: data.slug || filename,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  const postEntry = Object.entries(blogPosts).find(([path, content]) => {
    const { data } = parseFrontmatter(content);
    const filename = path.split("/").pop()?.replace(".md", "") || "";
    return data.slug === slug || filename === slug;
  });

  if (!postEntry) {
    return null;
  }

  const [, content] = postEntry;
  const { data, content: markdownContent } = parseFrontmatter(content);
  const filename = postEntry[0].split("/").pop()?.replace(".md", "") || "";

  return {
    title: data.title || "Untitled",
    date: data.date || new Date().toISOString().split("T")[0],
    excerpt: data.excerpt || "No excerpt available",
    slug: data.slug || filename,
    content: markdownContent,
  };
}
