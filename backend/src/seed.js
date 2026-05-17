import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import GoalSheet from './models/GoalSheet.js';

const year = new Date().getFullYear();
const forceReset = process.argv.includes('--reset');

async function seed() {
  await connectDB();

  const userCount = await User.countDocuments();
  if (userCount > 0 && !forceReset) {
    console.log('\n⚠️  Database already has data — seed skipped (your changes are safe).\n');
    console.log('   To wipe and reset demo users, run:  npm run seed:reset\n');
    await mongoose.disconnect();
    return;
  }

  if (forceReset) {
    console.log('Resetting database...');
    await User.deleteMany({});
    await GoalSheet.deleteMany({});
  }

  const admin = await User.create({
    email: 'admin@goalmatrix.com',
    password: 'password123',
    name: 'HR Admin',
    role: 'admin',
    department: 'Human Resources',
  });

  const manager = await User.create({
    email: 'manager@goalmatrix.com',
    password: 'password123',
    name: 'Sarah Manager',
    role: 'manager',
    department: 'Sales',
  });

  const employee1 = await User.create({
    email: 'employee@goalmatrix.com',
    password: 'password123',
    name: 'John Employee',
    role: 'employee',
    department: 'Sales',
    managerId: manager._id,
  });

  await User.create({
    email: 'jane@goalmatrix.com',
    password: 'password123',
    name: 'Jane Smith',
    role: 'employee',
    department: 'Sales',
    managerId: manager._id,
  });

  await User.create({
    email: 'mike@goalmatrix.com',
    password: 'password123',
    name: 'Mike Johnson',
    role: 'employee',
    department: 'Operations',
    managerId: manager._id,
  });

  await GoalSheet.create({
    employeeId: employee1._id,
    cycleYear: year,
    status: 'draft',
    goals: [
      {
        thrustArea: 'Revenue Growth',
        title: 'Increase Q1 Sales Revenue',
        description: 'Grow regional sales by 20% through new accounts',
        uomType: 'percentage_min',
        target: '20',
        weightage: 40,
      },
      {
        thrustArea: 'Customer Experience',
        title: 'Improve NPS Score',
        description: 'Raise Net Promoter Score across key accounts',
        uomType: 'numeric_min',
        target: '75',
        weightage: 30,
      },
      {
        thrustArea: 'Operational Excellence',
        title: 'Reduce Response TAT',
        description: 'Lower average ticket response time',
        uomType: 'numeric_max',
        target: '4',
        weightage: 30,
      },
    ],
  });

  console.log('\n✅ GoalMatrix seed complete!\n');
  console.log('Demo credentials (password: password123):\n');
  console.log('  Admin:    admin@goalmatrix.com');
  console.log('  Manager:  manager@goalmatrix.com');
  console.log('  Employee: employee@goalmatrix.com (has sample draft goals)\n');

  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
