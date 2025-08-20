// app/api/todos/[id]/route.ts - Fixed with proper async params handling
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params; // Await the params in Next.js 15

    // Validate ObjectId format
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid todo ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('todos');
    
    const todo = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    const formattedTodo = {
      ...todo,
      _id: todo._id.toString()
    };

    return NextResponse.json(formattedTodo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todo' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params; // Await the params in Next.js 15

    // Validate ObjectId format
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid todo ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('todos');
    
    const updateData = await request.json();
    
    // Add update timestamp
    const updatedTodo = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Remove _id from update data to avoid conflicts
    delete updatedTodo._id;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedTodo },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    const formattedTodo = {
      ...result,
      _id: result._id.toString()
    };

    return NextResponse.json(formattedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params; // Await the params in Next.js 15

    // Validate ObjectId format
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid todo ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('todos');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
}

// app/api/todos/route.ts - Main todos endpoint (no changes needed, your code looks good)
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