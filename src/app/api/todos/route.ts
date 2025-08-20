import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export interface Todo {
  _id?: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function GET() {
  try {
    const db = await getDatabase();
    const collection = db.collection('todos');

    const todos = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Convert ObjectId to string
    const formattedTodos = todos.map(todo => ({
      ...todo,
      _id: todo._id.toString()
    }));

    return NextResponse.json(formattedTodos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDatabase();
    const collection = db.collection('todos');
    
    const todoData = await request.json();
    
    // Validate required fields
    if (!todoData.title || !todoData.dueDate) {
      return NextResponse.json(
        { error: 'Title and due date are required' },
        { status: 400 }
      );
    }

    // Add timestamps
    const newTodo = {
      ...todoData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await collection.insertOne(newTodo);
    
    // Fetch the created todo to return it
    const createdTodo = await collection.findOne({ _id: result.insertedId });
    
    if (!createdTodo) {
      return NextResponse.json(
        { error: 'Failed to create todo' },
        { status: 500 }
      );
    }

    const formattedTodo = {
      ...createdTodo,
      _id: createdTodo._id.toString()
    };

    return NextResponse.json(formattedTodo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}