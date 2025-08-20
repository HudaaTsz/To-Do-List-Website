import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = params;

  // Validate ObjectId format
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: 'Invalid todo ID' },
      { status: 400 }
    );
  }

  try {
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
  const { id } = params;

  // Validate ObjectId format
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: 'Invalid todo ID' },
      { status: 400 }
    );
  }

  try {
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
  const { id } = params;

  // Validate ObjectId format
  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: 'Invalid todo ID' },
      { status: 400 }
    );
  }

  try {
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