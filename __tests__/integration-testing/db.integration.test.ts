import { describe, it, expect } from 'vitest';
import dbConnect from '../../lib/mongoose';
import mongoose from 'mongoose';

describe('Database Integration Test', () => {
  it('should connect to MongoDB successfully without errors', async () => {
    // Attempt to connect
    await dbConnect();
    
    // Check if mongoose is connected (readyState 1 means connected)
    expect(mongoose.connection.readyState).toBe(1);
  });
});
