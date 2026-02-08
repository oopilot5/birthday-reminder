import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { User } from '@/types';

// Ensure database is initialized
initDatabase();

// GET /api/users - Get all users
export async function GET() {
  try {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    const rows = stmt.all() as Array<{
      id: string;
      username: string;
      password: string | null;
      role: string;
      created_at: string;
    }>;

    const users: User[] = rows.map(row => ({
      id: row.id,
      username: row.username,
      role: row.role as User['role'],
      createdAt: row.created_at,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, role } = body;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (id, username, password, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, username, password || null, role, now);

    const user: User = {
      id,
      username,
      role,
      createdAt: now,
    };

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
