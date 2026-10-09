import type { Metadata } from "next";
import { AdminPosts } from "@/components/hub/admin";
import { requireAdmin } from "@/lib/auth";
import { getAdminPosts } from "@/lib/hub/admin";

export const metadata: Metadata = { title: "Posts", robots: { index: false, follow: false } };

export default async function AdminPostsPage() {
  await requireAdmin("/admin/posts");
  const posts = await getAdminPosts();
  return (
    <main>
      <header className="cb-hub-head">
        <div>
          <p className="cb-eyebrow">ADMIN</p>
          <h1>Progress posts</h1>
          <p>Posts go live when contributors add them. Hide anything that should not be public.</p>
        </div>
      </header>
      <AdminPosts posts={posts} />
    </main>
  );
}
