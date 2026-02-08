import { NextResponse } from 'next/server';
import db, { initDatabase } from '@/lib/db';
import { Person } from '@/types';

// Ensure database is initialized
initDatabase();

// GET /api/people/[id] - Get a specific person
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stmt = db.prepare('SELECT * FROM people WHERE id = ?');
    const row = stmt.get(id) as {
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
    } | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    const person: Person = {
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
    };

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 });
  }
}

// PUT /api/people/[id] - Update a person
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, birthDate, birthTime, isLunar, gender, category, visibleTo } = body;

    // Check if person exists
    const checkStmt = db.prepare('SELECT id FROM people WHERE id = ?');
    const existing = checkStmt.get(id);

    if (!existing) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE people
      SET name = ?, birth_date = ?, birth_time = ?, is_lunar = ?, gender = ?, category = ?, visible_to = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      name,
      birthDate,
      birthTime || null,
      isLunar ? 1 : 0,
      gender,
      category,
      JSON.stringify(visibleTo || []),
      now,
      id
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
      createdAt: '', // Will be fetched from DB
      updatedAt: now,
    };

    return NextResponse.json(person);
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json({ error: 'Failed to update person' }, { status: 500 });
  }
}

// DELETE /api/people/[id] - Delete a person
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stmt = db.prepare('DELETE FROM people WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 });
  }
}
