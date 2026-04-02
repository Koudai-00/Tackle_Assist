import { db } from '../../lib/db';
import { locationTags } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const tags = await db.select().from(locationTags).where(eq(locationTags.userId, userId));
    return Response.json({ tags });
  } catch (err) {
    console.error("Location tags GET error", err);
    return Response.json({ error: 'Failed to fetch location tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name } = body;

    if (!userId || !name) {
      return Response.json({ error: 'userId and name are required' }, { status: 400 });
    }

    await db.insert(locationTags).values({
      userId,
      name,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Location tags POST error", err);
    return Response.json({ error: 'Failed to create location tag' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId, id } = body;

    if (!userId || !id) {
      return Response.json({ error: 'userId and id are required' }, { status: 400 });
    }

    await db.delete(locationTags).where(
      and(eq(locationTags.id, id), eq(locationTags.userId, userId))
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("Location tags DELETE error", err);
    return Response.json({ error: 'Failed to delete location tag' }, { status: 500 });
  }
}
