const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Organization = require('./models/Organization');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collaborative_workspace_db';

async function forceSeedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Ensure Organization exists
    let org = await Organization.findOne({ orgId: 'ORG-NEXUS-01' });
    if (!org) {
      org = await Organization.create({
        orgId: 'ORG-NEXUS-01',
        orgName: 'Nexus Enterprise',
        allowedDomains: ['nexus.in', 'admin.nexus.in', 'emp.nexus.in', 'nexus.com'],
        status: 'Active'
      });
      console.log('Default organization created:', org.orgName);
    }

    const email = 'superadmin@admin.nexus.in';
    const rawPassword = 'AdminRoot123!';

    // Remove older/conflicting instance
    await User.deleteOne({ email });

    const admin = new User({
      name: 'Nexus Root Admin',
      email: email,
      password: rawPassword,
      role: 'Admin',
      organization: org._id
    });

    await admin.save();

    if (!org.owner) {
      org.owner = admin._id;
      await org.save();
    }

    console.log('\n=============================================');
    console.log(' Root Admin successfully initialized:');
    console.log(` Email:        ${email}`);
    console.log(` Password:     ${rawPassword}`);
    console.log(` Organization: ${org.orgName}`);
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

forceSeedAdmin();