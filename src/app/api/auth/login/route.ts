import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { User } from '@/types';

initDatabase();

// POST /api/auth/login - Verify login credentials
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username) as {
      id: string;
      username: string;
      password: string | null;
      role: string;
      created_at: string;
    } | undefined;

    if (!row) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Visitor login (no password required)
    if (row.role === 'visitor') {
      const user: User = {
        id: row.id,
        username: row.username,
        role: row.role as User['role'],
        createdAt: row.created_at,
      };
      return NextResponse.json({ success: true, user });
    }

    // Admin login (password required)
    if (row.role === 'admin') {
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 });
      }
      if (row.password !== password) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      const user: User = {
        id: row.id,
        username: row.username,
        role: row.role as User['role'],
        createdAt: row.created_at,
      };
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
