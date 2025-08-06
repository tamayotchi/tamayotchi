import { useMemo } from "react";
import { getAllBlogPosts } from "../utils/blog";
import BlogListPresentation from "./BlogListPresentation";

function BlogList() {
  const posts = useMemo(() => getAllBlogPosts(), []);

  return <BlogListPresentation posts={posts} />;
}

export default BlogList;
