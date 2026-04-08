// app/api/admin/blog-posts/[id]/route.ts
// Returns a single post by ID.
// Admin token → returns drafts too. No token → published only.

import { NextRequest, NextResponse } from 'next/server';

// Re-use whatever storage mechanism your existing /api/admin/blog-posts uses.
// Replace `getPostById` with your actual data-fetching logic.
import { getPostById } from '@/lib/posts'; // ← adjust path to match your project

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = req.headers.get('x-admin-token');
  const isAdmin = token && token === process.env.ADMIN_TOKEN;

  const post = await getPostById(params.id);

  if (!post) {
    return NextResponse.json({ data: null }, { status: 404 });
  }

  // Hide drafts from non-admins
  if (!post.published && !isAdmin) {
    return NextResponse.json({ data: null }, { status: 404 });
  }

  return NextResponse.json({ data: post });
}
