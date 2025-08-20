import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, testConnection } from '@/lib/mongodb';

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
    console.log('🔍 GET /api/todos - Fetching todos...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('todos');

    const todos = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`✅ Found ${todos.length} todos`);
    
    // Convert ObjectId to string
    const formattedTodos = todos.map(todo => ({
      ...todo,
      _id: todo._id.toString()
    }));

    return NextResponse.json(formattedTodos);
  } catch (error) {
    console.error('❌ Error fetching todos:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch todos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/todos - Creating new todo...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    const todoData = await request.json();
    console.log('📄 Todo data received:', todoData);
    
    // Validate required fields
    if (!todoData.title || !todoData.dueDate) {
      console.log('❌ Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Title and due date are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('todos');

    // Add timestamps
    const newTodo = {
      ...todoData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('💾 Inserting todo into database...');
    const result = await collection.insertOne(newTodo);
    console.log('✅ Todo inserted with ID:', result.insertedId);
    
    // Fetch the created todo to return it
    const createdTodo = await collection.findOne({ _id: result.insertedId });
    
    if (!createdTodo) {
      console.log('❌ Failed to retrieve created todo');
      return NextResponse.json(
        { error: 'Failed to create todo' },
        { status: 500 }
      );
    }

    const formattedTodo = {
      ...createdTodo,
      _id: createdTodo._id.toString()
    };

    console.log('🎉 Todo created successfully:', formattedTodo._id);
    return NextResponse.json(formattedTodo, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating todo:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create todo',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}