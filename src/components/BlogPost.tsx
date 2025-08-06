import { useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { getBlogPostBySlug } from "../utils/blog";
import BlogPostPresentation from "./BlogPostPresentation";

function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const post = useMemo(() => {
    if (!slug) return null;
    return getBlogPostBySlug(slug);
  }, [slug]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return <BlogPostPresentation post={post} />;
}

export default BlogPost;
