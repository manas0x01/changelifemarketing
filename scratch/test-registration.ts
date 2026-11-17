import assert from 'node:assert/strict';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

async function main() {
  config({ path: '.env.local', quiet: true });
  const uri = new URL(process.env.MONGODB_URI!);
  const database = `clm_registration_test_${Date.now()}`;
  uri.pathname = `/${database}`;
  process.env.MONGODB_URI = uri.toString();
  Object.assign(process.env, { NODE_ENV: 'test' });
  const log = console.log;
  const error = console.error;
  console.log = () => {};
  console.error = () => {};
  const { connectDB } = await import('../lib/database');
  const { default: User } = await import('../models/User');
  const { POST } = await import('../app/api/auth/register/route');
  const invoke = (body: object) => POST(new NextRequest('http://localhost/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
  try {
    await connectDB();
    assert.equal(mongoose.connection.name, database);
    for (const pack of ['A', 'B', 'C']) {
      const username = `REGTEST${pack}`;
      const pin = `TEST-PIN-${pack}`;
      await User.create({ username, userId: username, password: 'test-only-password', fullName: 'Registration test sponsor',
        ePins: [{ pin, status: 'Active', packageName: 'EPIN' }], activePins: 1,
        joiningDate: '2026-11-17', lastSessionDate: new Date(),
        lastSessionType: new Date(Date.now() + 19800000).getUTCHours() < 12 ? 'morning' : 'evening',
      });
      (global as any).mockSession = { user: { username } };
      if (pack === 'A') {
        await mongoose.disconnect();
        global.mongoose.conn = null;
        global.mongoose.promise = null;
      }
      const body = { fullName: 'Registration Test Member', mobileNo: '9000000000', sponsorId: username,
        uplineId: username, placementPosition: 'left', epin: pin, pincode: '834001', state: 'Jharkhand',
        package: `Healthcare PACK-${pack}`, dateOfBirth: '1995-11-17', gender: 'Male',
      };
      const response = await invoke(body);
      const result = await response.json();
      assert.equal(response.status, 200, `Pack ${pack}: ${result.message}`);
      assert.equal(result.success, true);
      const saved = await User.findOne({ username: result.user.username }).select('+password +transactionPassword');
      assert.ok(saved);
      assert.equal(saved.registeredPackage, body.package);
      assert.equal(saved.dateOfBirth?.toISOString(), '1995-11-17T00:00:00.000Z');
      assert.ok(await bcrypt.compare(result.user.password, saved.password));
      assert.ok(await bcrypt.compare(result.user.transactionPassword, saved.transactionPassword!));
      const sponsor = await User.findOne({ username });
      assert.equal(sponsor?.leftChild, saved.username);
      assert.equal(sponsor?.activePins, 0);
      assert.equal(sponsor?.usedPins, 1);
      assert.equal(sponsor?.ePins?.length, 0);
      assert.equal(sponsor?.totalTeam?.left, 1);
      const count = await User.countDocuments();
      const replay = await invoke(body);
      assert.equal(replay.status, 400);
      assert.equal(await User.countDocuments(), count);
      log(`PASS pack ${pack}: registration success, database saved, DOB correct, credentials work, placement linked, EPIN consumed once, replay rejected`);
    }
    const invalid = await invoke({});
    assert.equal(invalid.status, 400);
    log('PASS missing fields rejected');
  } finally {
    if (mongoose.connection.readyState === 1 && mongoose.connection.name === database && database.startsWith('clm_registration_test_')) {
      await mongoose.connection.dropDatabase();
      log('Removed isolated test database');
    }
    await mongoose.disconnect();
    console.log = log;
    console.error = error;
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
