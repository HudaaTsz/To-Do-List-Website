import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, testConnection } from '@/lib/mongodb';

export async function GET() {
  const db = await getDatabase();
  const collection = db.collection('todos');
  const todos = await collection.find({}).sort({ createdAt: -1 }).toArray();

  return NextResponse.json(
    todos.map(todo => ({ ...todo, _id: todo._id.toString() }))
  );
}

export async function POST(request: NextRequest) {
  const db = await getDatabase();
  const collection = db.collection('todos');

  const todoData = await request.json();
  const newTodo = {
    ...todoData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const result = await collection.insertOne(newTodo);
  const createdTodo = await collection.findOne({ _id: result.insertedId });

  return NextResponse.json({ ...createdTodo, _id: createdTodo?._id.toString() }, { status: 201 });
}
