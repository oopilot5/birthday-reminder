import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';

// Ensure database is initialized
initDatabase();

// POST /api/init - Initialize default data
export async function POST() {
  try {
    // Check if any admin user exists
    const adminCheck = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const adminCount = adminCheck.get() as { count: number };

    // Check if visitor user exists
    const visitorCheck = db.prepare("SELECT COUNT(*) as count FROM users WHERE username = 'visitor'");
    const visitorCount = visitorCheck.get() as { count: number };

    const results = {
      adminExists: adminCount.count > 0,
      visitorExists: visitorCount.count > 0,
      initialized: false,
    };

    // Create visitor if not exists
    if (!results.visitorExists) {
      const insertVisitor = db.prepare(`
        INSERT INTO users (id, username, role, created_at)
        VALUES (?, ?, ?, ?)
      `);
      insertVisitor.run(crypto.randomUUID(), 'visitor', 'visitor', new Date().toISOString());
      results.visitorExists = true;
      results.initialized = true;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}
