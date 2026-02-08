import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { Person } from '@/types';

// Ensure database is initialized
initDatabase();

// GET /api/people - Get all people
export async function GET() {
  try {
    const stmt = db.prepare('SELECT * FROM people ORDER BY created_at DESC');
    const rows = stmt.all() as Array<{
      id: string;
      name: string;
      birth_date: string;
      birth_time: string | null;
      is_lunar: number;
      gender: string;
      category: string;
      visible_to: string;
      created_at: string;
      updated_at: string;
    }>;

    const people: Person[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      birthDate: row.birth_date,
      birthTime: row.birth_time || undefined,
      isLunar: Boolean(row.is_lunar),
      gender: row.gender as Person['gender'],
      category: row.category as Person['category'],
      visibleTo: JSON.parse(row.visible_to),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

// POST /api/people - Create a new person
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, birthDate, birthTime, isLunar, gender, category, visibleTo } = body;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO people (id, name, birth_date, birth_time, is_lunar, gender, category, visible_to, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      name,
      birthDate,
      birthTime || null,
      isLunar ? 1 : 0,
      gender,
      category,
      JSON.stringify(visibleTo || []),
      now,
      now
    );

    const person: Person = {
      id,
      name,
      birthDate,
      birthTime,
      isLunar,
      gender,
      category,
      visibleTo: visibleTo || [],
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json(person, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}
