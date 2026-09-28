const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Task = require('./models/Task');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexus';

async function seedData() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');

    // 1. Clear existing collections to give a clean, rich dataset
    console.log('Clearing existing tasks, workspaces, and users...');
    await Task.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});

    // 2. Create Users
    console.log('Seeding corporate users...');
    const adminUser = await User.create({
      name: 'Nexus Root Admin',
      email: 'superadmin@admin.nexus.in',
      password: 'AdminRoot123!',
      role: 'Admin'
    });

    const rahul = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.sharma@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member'
    });

    const priya = await User.create({
      name: 'Priya Patel',
      email: 'priya.patel@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member'
    });

    const ananya = await User.create({
      name: 'Ananya Singh',
      email: 'ananya.singh@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member'
    });

    const vikram = await User.create({
      name: 'Vikram Verma',
      email: 'vikram.verma@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member'
    });

    const neha = await User.create({
      name: 'Neha Gupta',
      email: 'neha.gupta@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member'
    });

    console.log('Seeded 1 Root Admin and 5 Corporate Members.');

    // 3. Create Workspaces
    console.log('Seeding workspaces...');
    const ws1 = await Workspace.create({
      name: 'Sprint 1 - Core Services',
      description: 'API microservices, authentication security, and RBAC governance.',
      owner: adminUser._id,
      members: [adminUser._id, rahul._id, priya._id, ananya._id, vikram._id]
    });

    const ws2 = await Workspace.create({
      name: 'UI/UX Redesign & Design System',
      description: 'Modernizing the component library, responsive Kanban board, and accessible color tokens.',
      owner: adminUser._id,
      members: [adminUser._id, priya._id, neha._id, rahul._id]
    });

    const ws3 = await Workspace.create({
      name: 'Cloud Infrastructure & CI/CD',
      description: 'Docker containerization, automated testing pipelines, and staging deployment automation.',
      owner: adminUser._id,
      members: [adminUser._id, ananya._id, vikram._id]
    });

    console.log('Seeded 3 Workspaces.');

    // Helper for staggered timestamps (past 7 days)
    const daysAgo = (days) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d;
    };

    // 4. Create Rich Task Dataset across workspaces
    console.log('Seeding tasks with diverse priorities, statuses, and assignees...');
    const tasksToInsert = [
      // --- Workspace 1: Core Services ---
      {
        title: 'Configure JWT Rate Limiting & Helmet Security',
        description: 'Prevent brute-force authentication attacks using express-rate-limit and Helmet headers.',
        status: 'Completed',
        priority: 'High',
        workspace: ws1._id,
        assignedTo: rahul._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(5)
      },
      {
        title: 'Implement MongoDB Indexing on Workspace Members',
        description: 'Optimize queries filtering by user workspace membership and task status.',
        status: 'Completed',
        priority: 'High',
        workspace: ws1._id,
        assignedTo: rahul._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4)
      },
      {
        title: 'Build Refresh Token Rotation Architecture',
        description: 'Extend session security by storing hashed refresh tokens with automatic revocation.',
        status: 'In Progress',
        priority: 'High',
        workspace: ws1._id,
        assignedTo: rahul._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Audit User Role-Based Access Guards',
        description: 'Verify that employees cannot invoke administrative endpoints under /api/auth/provision.',
        status: 'Completed',
        priority: 'Medium',
        workspace: ws1._id,
        assignedTo: vikram._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(3)
      },
      {
        title: 'Setup Automated Daily Database Backups',
        description: 'Cron job to dump MongoDB collections to encrypted S3 storage buckets.',
        status: 'Completed',
        priority: 'Low',
        workspace: ws1._id,
        assignedTo: ananya._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(4)
      },
      {
        title: 'Draft OpenAPI / Swagger Specification',
        description: 'Document all REST endpoints with sample JSON request and response payloads.',
        status: 'In Progress',
        priority: 'Medium',
        workspace: ws1._id,
        assignedTo: priya._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Implement Webhook Notification Service',
        description: 'Deliver Slack and Discord webhooks on major task milestone completions.',
        status: 'To Do',
        priority: 'Low',
        workspace: ws1._id,
        assignedTo: null,
        createdBy: adminUser._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },
      {
        title: 'Investigate Intermittent Redis Connection Drops',
        description: 'Debug TCP keep-alive settings on AWS ElastiCache cluster nodes.',
        status: 'To Do',
        priority: 'High',
        workspace: ws1._id,
        assignedTo: ananya._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      },

      // --- Workspace 2: UI/UX Redesign ---
      {
        title: 'Modernize Kanban Board with Glassmorphism Cards',
        description: 'Upgrade card styling with subtle borders, smooth drop-shadows, and active drag states.',
        status: 'Completed',
        priority: 'High',
        workspace: ws2._id,
        assignedTo: priya._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(6)
      },
      {
        title: 'Create Accessible Color Palette for Priority Badges',
        description: 'Ensure WCAG AAA contrast ratio compliance on High, Medium, and Low tags.',
        status: 'Completed',
        priority: 'Medium',
        workspace: ws2._id,
        assignedTo: neha._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4)
      },
      {
        title: 'Fix Mobile Touch Drag-and-Drop Polyfill',
        description: 'Add mobile touch gesture listeners to enable card movement on iPad and smartphones.',
        status: 'In Progress',
        priority: 'High',
        workspace: ws2._id,
        assignedTo: priya._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Design Micro-Animations for Column Dropzones',
        description: 'Add subtle scale and pulse feedback when dragging cards over dropzones.',
        status: 'In Progress',
        priority: 'Medium',
        workspace: ws2._id,
        assignedTo: neha._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Typography & Font System Upgrade (Inter Variable)',
        description: 'Incorporate Google Fonts Inter with precise optical sizing across all dashboards.',
        status: 'Completed',
        priority: 'Low',
        workspace: ws2._id,
        assignedTo: neha._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(5)
      },
      {
        title: 'Add Keyboard Shortcuts for Quick Task Creation',
        description: 'Pressing "C" should toggle the task creation modal with autofocus on title input.',
        status: 'To Do',
        priority: 'Low',
        workspace: ws2._id,
        assignedTo: rahul._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },
      {
        title: 'Empty State Illustrations for Zero-Task Columns',
        description: 'Design friendly SVG illustrations when a Kanban column has no cards.',
        status: 'To Do',
        priority: 'Low',
        workspace: ws2._id,
        assignedTo: neha._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      },

      // --- Workspace 3: Cloud Infrastructure & CI/CD ---
      {
        title: 'Dockerize Node.js Express Application',
        description: 'Multi-stage Dockerfile optimizing image layer caching and reducing footprint under 120MB.',
        status: 'Completed',
        priority: 'High',
        workspace: ws3._id,
        assignedTo: ananya._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(6)
      },
      {
        title: 'Setup GitHub Actions CI Pipeline',
        description: 'Run linter, Jest unit tests, and security dependency scan on every pull request.',
        status: 'Completed',
        priority: 'High',
        workspace: ws3._id,
        assignedTo: ananya._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(4)
      },
      {
        title: 'Implement Automated Smoke Test Suite in Cypress',
        description: 'Validate sign-in flow, workspace switching, and card status transitions.',
        status: 'In Progress',
        priority: 'High',
        workspace: ws3._id,
        assignedTo: vikram._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Configure Prometheus Metrics & Grafana Dashboard',
        description: 'Monitor request latencies, memory consumption, and 4xx/5xx HTTP error frequencies.',
        status: 'In Progress',
        priority: 'Medium',
        workspace: ws3._id,
        assignedTo: ananya._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Stress Test API under 5,000 Concurrent Virtual Users',
        description: 'Use k6 / Artillery to evaluate response degradation under high throughput.',
        status: 'To Do',
        priority: 'Medium',
        workspace: ws3._id,
        assignedTo: vikram._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },
      {
        title: 'SSL Certificate Auto-Renewal with Certbot',
        description: 'Setup Let\'s Encrypt automatic certificate renewal verification script.',
        status: 'Completed',
        priority: 'Low',
        workspace: ws3._id,
        assignedTo: ananya._id,
        createdBy: adminUser._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4)
      }
    ];

    for (const t of tasksToInsert) {
      const taskDoc = new Task(t);
      // Preserve custom timestamps for realistic analytics
      taskDoc.createdAt = t.createdAt;
      taskDoc.updatedAt = t.updatedAt;
      await taskDoc.save();
    }

    console.log(`Successfully seeded ${tasksToInsert.length} tasks across 3 workspaces!`);

    console.log('\n=============================================');
    console.log('--- NEXUS ENTERPRISE SEEDING COMPLETE ---');
    console.log('Root Administrator:');
    console.log('  Email:    superadmin@admin.nexus.in');
    console.log('  Password: AdminRoot123!');
    console.log('\nSample Employees (Password for all: EmpPass123!):');
    console.log('  1. rahul.sharma@emp.nexus.in');
    console.log('  2. priya.patel@emp.nexus.in');
    console.log('  3. ananya.singh@emp.nexus.in');
    console.log('  4. vikram.verma@emp.nexus.in');
    console.log('  5. neha.gupta@emp.nexus.in');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
