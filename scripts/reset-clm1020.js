#!/usr/bin/env node
/**
 * scripts/reset-clm1020.js
 *
 * Usage:
 *   MONGODB_URI="mongodb://localhost:27017/changelifemarketing" node scripts/reset-clm1020.js
 *
 * This script finds the user with `userId` or `username` "CLM1020" and resets these fields:
 *  - totalTeam → { left: 0, right: 0 }
 *  - basicIncome → 0
 *  - totalIncome → 0
 *  - sessionBasedIncome → []
 *  - directMembers → []
 *  - leftChild, rightChild → ""
 *
 * Run with caution — this mutates the database.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const USER_KEY = 'CLM1020';

async function run() {
  const uri = 'mongodb+srv://changelifemarketing:Ajay25763578@cluster0.4fh15ul.mongodb.net/changelifemarketing?appName=Cluster0';
  if (!uri) {
    console.error('ERROR: MONGODB_URI not set. Example: mongodb://localhost:27017/changelifemarketing');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');

    const filter = { $or: [{ userId: USER_KEY }, { username: USER_KEY }] };
    const before = await users.findOne(filter);
    if (!before) {
      console.log('User not found for', USER_KEY);
      return;
    }

    console.log('Before update:', JSON.stringify({
      userId: before.userId,
      username: before.username,
      totalTeam: before.totalTeam,
      basicIncome: before.basicIncome,
      totalIncome: before.totalIncome,
      leftChild: before.leftChild,
      rightChild: before.rightChild,
      directMembersCount: Array.isArray(before.directMembers) ? before.directMembers.length : 0,
    }, null, 2));

    const update = {
      $set: {
        totalTeam: { left: 0, right: 0 },
        basicIncome: 0,
        totalIncome: 0,
        sessionBasedIncome: [],
        directMembers: [],
        leftChild: '',
        rightChild: '',
      }
    };

    const result = await users.updateOne(filter, update);
    if (result.matchedCount === 0) {
      console.log('No matching user updated');
    } else {
      console.log('Updated user. Modified count:', result.modifiedCount);
      const after = await users.findOne(filter);
      console.log('After update:', JSON.stringify({
        userId: after.userId,
        username: after.username,
        totalTeam: after.totalTeam,
        basicIncome: after.basicIncome,
        totalIncome: after.totalIncome,
        leftChild: after.leftChild,
        rightChild: after.rightChild,
        directMembersCount: Array.isArray(after.directMembers) ? after.directMembers.length : 0,
      }, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
