import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const db = await getDatabase();
  const todo = await db.collection('todos').findOne({ _id: new ObjectId(id) });

  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  return NextResponse.json({ ...todo, _id: todo._id.toString() });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const updateData = await request.json();
  delete updateData._id;
  updateData.updatedAt = new Date().toISOString();

  const db = await getDatabase();
  const result = await db.collection('todos').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!result) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  return NextResponse.json({ ...result, _id: result._id.toString() });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const db = await getDatabase();
  const result = await db.collection('todos').deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Todo deleted successfully' });
}
