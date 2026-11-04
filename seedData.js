const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Task = require('./models/Task');
const Organization = require('./models/Organization');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collaborative_workspace_db';

// Helper for staggered timestamps (past 7 days)
const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

async function seedData() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');

    // 1. Clear existing collections to give a clean, rich dataset
    console.log('Clearing existing tasks, workspaces, users, and organizations...');
    await Task.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});
    await Organization.deleteMany({});

    // =========================================================================
    // ORGANIZATION 1: Nexus Enterprise (ORG-NEXUS-01)
    // =========================================================================
    console.log('\n--- Seeding 1. Nexus Enterprise ---');
    const nexusOrg = await Organization.create({
      orgId: 'ORG-NEXUS-01',
      orgName: 'Nexus Enterprise',
      allowedDomains: ['nexus.in', 'admin.nexus.in', 'emp.nexus.in', 'nexus.com'],
      status: 'Active',
      plan: 'Enterprise',
      description: 'Core financial tech and enterprise infrastructure solutions.'
    });

    const nexusAdmin = await User.create({
      name: 'Nexus Root Admin',
      email: 'superadmin@admin.nexus.in',
      password: 'AdminRoot123!',
      role: 'Admin',
      organization: nexusOrg._id
    });

    const rahul = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.sharma@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member',
      organization: nexusOrg._id
    });

    const priya = await User.create({
      name: 'Priya Patel',
      email: 'priya.patel@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member',
      organization: nexusOrg._id
    });

    const ananya = await User.create({
      name: 'Ananya Singh',
      email: 'ananya.singh@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member',
      organization: nexusOrg._id
    });

    const vikram = await User.create({
      name: 'Vikram Verma',
      email: 'vikram.verma@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member',
      organization: nexusOrg._id
    });

    const neha = await User.create({
      name: 'Neha Gupta',
      email: 'neha.gupta@emp.nexus.in',
      password: 'EmpPass123!',
      role: 'Member',
      organization: nexusOrg._id
    });

    nexusOrg.owner = nexusAdmin._id;
    nexusOrg.members = [
      { user: nexusAdmin._id, role: 'Owner' },
      { user: rahul._id, role: 'Member' },
      { user: priya._id, role: 'Member' },
      { user: ananya._id, role: 'Member' },
      { user: vikram._id, role: 'Member' },
      { user: neha._id, role: 'Member' }
    ];
    await nexusOrg.save();

    const wsNexus1 = await Workspace.create({
      name: 'Sprint 1 - Core Services',
      description: 'API microservices, authentication security, and RBAC governance.',
      owner: nexusAdmin._id,
      organization: nexusOrg._id,
      members: [nexusAdmin._id, rahul._id, priya._id, ananya._id, vikram._id]
    });

    const wsNexus2 = await Workspace.create({
      name: 'UI/UX Redesign & Design System',
      description: 'Modernizing the component library, responsive Kanban board, and accessible color tokens.',
      owner: nexusAdmin._id,
      organization: nexusOrg._id,
      members: [nexusAdmin._id, priya._id, neha._id, rahul._id]
    });

    const wsNexus3 = await Workspace.create({
      name: 'Cloud Infrastructure & CI/CD',
      description: 'Docker containerization, automated testing pipelines, and staging deployment automation.',
      owner: nexusAdmin._id,
      organization: nexusOrg._id,
      members: [nexusAdmin._id, ananya._id, vikram._id]
    });

    console.log('Seeded Nexus Enterprise (1 Admin, 5 Employees, 3 Workspaces).');

    // =========================================================================
    // ORGANIZATION 2: Apex Global Labs (ORG-APEX-02)
    // =========================================================================
    console.log('\n--- Seeding 2. Apex Global Labs ---');
    const apexOrg = await Organization.create({
      orgId: 'ORG-APEX-02',
      orgName: 'Apex Global Labs',
      allowedDomains: ['apexlabs.io', 'admin.apexlabs.io', 'emp.apexlabs.io', 'apexlabs.com'],
      status: 'Active',
      plan: 'Enterprise',
      description: 'Applied artificial intelligence, neural architectures, and intelligent edge platforms.'
    });

    const apexAdmin = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.vance@admin.apexlabs.io',
      password: 'ApexAdmin123!',
      role: 'Admin',
      organization: apexOrg._id
    });

    const elena = await User.create({
      name: 'Elena Rostova',
      email: 'elena.rostova@emp.apexlabs.io',
      password: 'EmpPass123!',
      role: 'Member',
      organization: apexOrg._id
    });

    const david = await User.create({
      name: 'David Kim',
      email: 'david.kim@emp.apexlabs.io',
      password: 'EmpPass123!',
      role: 'Member',
      organization: apexOrg._id
    });

    const sophia = await User.create({
      name: 'Sophia Martinez',
      email: 'sophia.martinez@emp.apexlabs.io',
      password: 'EmpPass123!',
      role: 'Member',
      organization: apexOrg._id
    });

    const arjun = await User.create({
      name: 'Arjun Mehta',
      email: 'arjun.mehta@emp.apexlabs.io',
      password: 'EmpPass123!',
      role: 'Member',
      organization: apexOrg._id
    });

    apexOrg.owner = apexAdmin._id;
    apexOrg.members = [
      { user: apexAdmin._id, role: 'Owner' },
      { user: elena._id, role: 'Member' },
      { user: david._id, role: 'Member' },
      { user: sophia._id, role: 'Member' },
      { user: arjun._id, role: 'Member' }
    ];
    await apexOrg.save();

    const wsApex1 = await Workspace.create({
      name: 'Autonomous AI Inference Engine',
      description: 'Low-latency transformer inference pipelines and ONNX model optimization.',
      owner: apexAdmin._id,
      organization: apexOrg._id,
      members: [apexAdmin._id, elena._id, david._id]
    });

    const wsApex2 = await Workspace.create({
      name: 'Edge Device SDK & Hardware Acceleration',
      description: 'Embedded Linux C++ SDK, CUDA drivers, and telemetry sync daemon.',
      owner: apexAdmin._id,
      organization: apexOrg._id,
      members: [apexAdmin._id, sophia._id, arjun._id, david._id]
    });

    console.log('Seeded Apex Global Labs (1 Admin, 4 Employees, 2 Workspaces).');

    // =========================================================================
    // ORGANIZATION 3: Stellar Dynamics (ORG-STELLAR-03)
    // =========================================================================
    console.log('\n--- Seeding 3. Stellar Dynamics ---');
    const stellarOrg = await Organization.create({
      orgId: 'ORG-STELLAR-03',
      orgName: 'Stellar Dynamics',
      allowedDomains: ['stellardynamics.com', 'admin.stellardynamics.com', 'emp.stellardynamics.com'],
      status: 'Active',
      plan: 'Pro',
      description: 'Aerospace telemetry systems, satellite ground stations, and mission operations.'
    });

    const stellarAdmin = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@admin.stellardynamics.com',
      password: 'StellarAdmin123!',
      role: 'Admin',
      organization: stellarOrg._id
    });

    const tariq = await User.create({
      name: 'Tariq Al-Mansoor',
      email: 'tariq.mansoor@emp.stellardynamics.com',
      password: 'EmpPass123!',
      role: 'Member',
      organization: stellarOrg._id
    });

    const chloe = await User.create({
      name: 'Chloe Dubois',
      email: 'chloe.dubois@emp.stellardynamics.com',
      password: 'EmpPass123!',
      role: 'Member',
      organization: stellarOrg._id
    });

    const lucas = await User.create({
      name: 'Lucas Silva',
      email: 'lucas.silva@emp.stellardynamics.com',
      password: 'EmpPass123!',
      role: 'Member',
      organization: stellarOrg._id
    });

    stellarOrg.owner = stellarAdmin._id;
    stellarOrg.members = [
      { user: stellarAdmin._id, role: 'Owner' },
      { user: tariq._id, role: 'Member' },
      { user: chloe._id, role: 'Member' },
      { user: lucas._id, role: 'Member' }
    ];
    await stellarOrg.save();

    const wsStellar1 = await Workspace.create({
      name: 'Orbital Constellation Telemetry',
      description: 'Real-time telemetry packet ingestion, demodulation, and orbit prediction.',
      owner: stellarAdmin._id,
      organization: stellarOrg._id,
      members: [stellarAdmin._id, tariq._id, chloe._id]
    });

    const wsStellar2 = await Workspace.create({
      name: 'Mission Control Dashboard',
      description: 'Operator consoles, 3D orbit visualization, and automated alert dispatching.',
      owner: stellarAdmin._id,
      organization: stellarOrg._id,
      members: [stellarAdmin._id, chloe._id, lucas._id]
    });

    console.log('Seeded Stellar Dynamics (1 Admin, 3 Employees, 2 Workspaces).');

    // =========================================================================
    // ORGANIZATION 4: Pulse Health Tech (ORG-PULSE-04)
    // =========================================================================
    console.log('\n--- Seeding 4. Pulse Health Tech ---');
    const pulseOrg = await Organization.create({
      orgId: 'ORG-PULSE-04',
      orgName: 'Pulse Health Tech',
      allowedDomains: ['pulsehealth.io', 'admin.pulsehealth.io', 'emp.pulsehealth.io'],
      status: 'Active',
      plan: 'Enterprise',
      description: 'Next-generation clinical tele-health, HIPAA-compliant patient portals, and wearable IoT diagnostics.'
    });

    const pulseAdmin = await User.create({
      name: 'Dr. Arthur Pendelton',
      email: 'arthur.pendelton@admin.pulsehealth.io',
      password: 'PulseAdmin123!',
      role: 'Admin',
      organization: pulseOrg._id
    });

    const maya = await User.create({
      name: 'Maya Lin',
      email: 'maya.lin@emp.pulsehealth.io',
      password: 'EmpPass123!',
      role: 'Member',
      organization: pulseOrg._id
    });

    const carlos = await User.create({
      name: 'Carlos Mendez',
      email: 'carlos.mendez@emp.pulsehealth.io',
      password: 'EmpPass123!',
      role: 'Member',
      organization: pulseOrg._id
    });

    const zainab = await User.create({
      name: 'Zainab Khan',
      email: 'zainab.khan@emp.pulsehealth.io',
      password: 'EmpPass123!',
      role: 'Member',
      organization: pulseOrg._id
    });

    pulseOrg.owner = pulseAdmin._id;
    pulseOrg.members = [
      { user: pulseAdmin._id, role: 'Owner' },
      { user: maya._id, role: 'Member' },
      { user: carlos._id, role: 'Member' },
      { user: zainab._id, role: 'Member' }
    ];
    await pulseOrg.save();

    const wsPulse1 = await Workspace.create({
      name: 'HIPAA Clinical Records Sync',
      description: 'FHIR API adapters, end-to-end encrypted EHR exchange, and audit trails.',
      owner: pulseAdmin._id,
      organization: pulseOrg._id,
      members: [pulseAdmin._id, maya._id, carlos._id]
    });

    const wsPulse2 = await Workspace.create({
      name: 'Wearable IoT Vitals Streaming',
      description: 'Bluetooth Low Energy sensor ingest, arrhythmia detection, and alerts.',
      owner: pulseAdmin._id,
      organization: pulseOrg._id,
      members: [pulseAdmin._id, zainab._id, carlos._id]
    });

    console.log('Seeded Pulse Health Tech (1 Admin, 3 Employees, 2 Workspaces).');

    // =========================================================================
    // 5. Seed Tasks Across All Organizations and Workspaces
    // =========================================================================
    console.log('\nSeeding rich tasks across all organizations and workspaces...');
    const tasksToInsert = [
      // -----------------------------------------------------------------------
      // NEXUS ENTERPRISE TASKS
      // -----------------------------------------------------------------------
      // --- Nexus Workspace 1: Core Services ---
      {
        title: 'Configure JWT Rate Limiting & Helmet Security',
        description: 'Prevent brute-force authentication attacks using express-rate-limit and Helmet headers.',
        status: 'Completed',
        priority: 'High',
        workspace: wsNexus1._id,
        assignedTo: rahul._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(5)
      },
      {
        title: 'Implement MongoDB Indexing on Workspace Members',
        description: 'Optimize queries filtering by user workspace membership and task status.',
        status: 'Completed',
        priority: 'High',
        workspace: wsNexus1._id,
        assignedTo: rahul._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4)
      },
      {
        title: 'Build Refresh Token Rotation Architecture',
        description: 'Extend session security by storing hashed refresh tokens with automatic revocation.',
        status: 'In Progress',
        priority: 'High',
        workspace: wsNexus1._id,
        assignedTo: rahul._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Audit User Role-Based Access Guards',
        description: 'Verify that employees cannot invoke administrative endpoints under /api/auth/provision.',
        status: 'Completed',
        priority: 'Medium',
        workspace: wsNexus1._id,
        assignedTo: vikram._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(3)
      },
      {
        title: 'Setup Automated Daily Database Backups',
        description: 'Cron job to dump MongoDB collections to encrypted S3 storage buckets.',
        status: 'Completed',
        priority: 'Low',
        workspace: wsNexus1._id,
        assignedTo: ananya._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(4)
      },
      {
        title: 'Draft OpenAPI / Swagger Specification',
        description: 'Document all REST endpoints with sample JSON request and response payloads.',
        status: 'In Progress',
        priority: 'Medium',
        workspace: wsNexus1._id,
        assignedTo: priya._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Implement Webhook Notification Service',
        description: 'Deliver Slack and Discord webhooks on major task milestone completions.',
        status: 'To Do',
        priority: 'Low',
        workspace: wsNexus1._id,
        assignedTo: null,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },
      {
        title: 'Investigate Intermittent Redis Connection Drops',
        description: 'Debug TCP keep-alive settings on AWS ElastiCache cluster nodes.',
        status: 'To Do',
        priority: 'High',
        workspace: wsNexus1._id,
        assignedTo: ananya._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      },

      // --- Nexus Workspace 2: UI/UX Redesign ---
      {
        title: 'Modernize Kanban Board with Glassmorphism Cards',
        description: 'Upgrade card styling with subtle borders, smooth drop-shadows, and active drag states.',
        status: 'Completed',
        priority: 'High',
        workspace: wsNexus2._id,
        assignedTo: priya._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(6)
      },
      {
        title: 'Create Accessible Color Palette for Priority Badges',
        description: 'Ensure WCAG AAA contrast ratio compliance on High, Medium, and Low tags.',
        status: 'Completed',
        priority: 'Medium',
        workspace: wsNexus2._id,
        assignedTo: neha._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4)
      },
      {
        title: 'Fix Mobile Touch Drag-and-Drop Polyfill',
        description: 'Add mobile touch gesture listeners to enable card movement on iPad and smartphones.',
        status: 'In Progress',
        priority: 'High',
        workspace: wsNexus2._id,
        assignedTo: priya._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Design Micro-Animations for Column Dropzones',
        description: 'Add subtle scale and pulse feedback when dragging cards over dropzones.',
        status: 'In Progress',
        priority: 'Medium',
        workspace: wsNexus2._id,
        assignedTo: neha._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Typography & Font System Upgrade (Inter Variable)',
        description: 'Incorporate Google Fonts Inter with precise optical sizing across all dashboards.',
        status: 'Completed',
        priority: 'Low',
        workspace: wsNexus2._id,
        assignedTo: neha._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(5)
      },
      {
        title: 'Add Keyboard Shortcuts for Quick Task Creation',
        description: 'Pressing "C" should toggle the task creation modal with autofocus on title input.',
        status: 'To Do',
        priority: 'Low',
        workspace: wsNexus2._id,
        assignedTo: rahul._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },
      {
        title: 'Empty State Illustrations for Zero-Task Columns',
        description: 'Design friendly SVG illustrations when a Kanban column has no cards.',
        status: 'To Do',
        priority: 'Low',
        workspace: wsNexus2._id,
        assignedTo: neha._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      },

      // --- Nexus Workspace 3: Cloud Infrastructure & CI/CD ---
      {
        title: 'Dockerize Node.js Express Application',
        description: 'Multi-stage Dockerfile optimizing image layer caching and reducing footprint under 120MB.',
        status: 'Completed',
        priority: 'High',
        workspace: wsNexus3._id,
        assignedTo: ananya._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(6)
      },
      {
        title: 'Setup GitHub Actions CI Pipeline',
        description: 'Run linter, Jest unit tests, and security dependency scan on every pull request.',
        status: 'Completed',
        priority: 'High',
        workspace: wsNexus3._id,
        assignedTo: ananya._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(4)
      },
      {
        title: 'Implement Automated Smoke Test Suite in Cypress',
        description: 'Validate sign-in flow, workspace switching, and card status transitions.',
        status: 'In Progress',
        priority: 'High',
        workspace: wsNexus3._id,
        assignedTo: vikram._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Configure Prometheus Metrics & Grafana Dashboard',
        description: 'Monitor request latencies, memory consumption, and 4xx/5xx HTTP error frequencies.',
        status: 'In Progress',
        priority: 'Medium',
        workspace: wsNexus3._id,
        assignedTo: ananya._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Stress Test API under 5,000 Concurrent Virtual Users',
        description: 'Use k6 / Artillery to evaluate response degradation under high throughput.',
        status: 'To Do',
        priority: 'Medium',
        workspace: wsNexus3._id,
        assignedTo: vikram._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },
      {
        title: "SSL Certificate Auto-Renewal with Certbot",
        description: "Setup Let's Encrypt automatic certificate renewal verification script.",
        status: 'Completed',
        priority: 'Low',
        workspace: wsNexus3._id,
        assignedTo: ananya._id,
        createdBy: nexusAdmin._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4)
      },

      // -----------------------------------------------------------------------
      // APEX GLOBAL LABS TASKS
      // -----------------------------------------------------------------------
      // --- Apex Workspace 1: Autonomous AI Inference Engine ---
      {
        title: 'Quantize Vision-Language Model to INT8 for GPU Clusters',
        description: 'Benchmark inference latency and VRAM consumption across NVIDIA TensorRT runtime.',
        status: 'Completed',
        priority: 'High',
        workspace: wsApex1._id,
        assignedTo: elena._id,
        createdBy: apexAdmin._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(5)
      },
      {
        title: 'Build Distributed Feature Store on Redis Cluster',
        description: 'Cache real-time embedding vectors for fast semantic retrieval and reranking.',
        status: 'In Progress',
        priority: 'High',
        workspace: wsApex1._id,
        assignedTo: david._id,
        createdBy: apexAdmin._id,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Implement Streaming Token Output with Server-Sent Events',
        description: 'Expose SSE streaming endpoint for real-time generative responses.',
        status: 'To Do',
        priority: 'Medium',
        workspace: wsApex1._id,
        assignedTo: elena._id,
        createdBy: apexAdmin._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },

      // --- Apex Workspace 2: Edge Device SDK & Hardware Acceleration ---
      {
        title: 'Port C++ Inference Pipeline to ARM64 Jetson Orin',
        description: 'Cross-compile neural core libraries for edge robotics platforms.',
        status: 'Completed',
        priority: 'High',
        workspace: wsApex2._id,
        assignedTo: sophia._id,
        createdBy: apexAdmin._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(3)
      },
      {
        title: 'Implement Over-the-Air (OTA) Firmware Encryption',
        description: 'Sign edge device update payloads using Ed25519 cryptographic keys.',
        status: 'In Progress',
        priority: 'High',
        workspace: wsApex2._id,
        assignedTo: arjun._id,
        createdBy: apexAdmin._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Design Telemetry Ping Compression Protocol',
        description: 'Compress device diagnostic metrics with Brotli to save satellite cellular bandwidth.',
        status: 'To Do',
        priority: 'Low',
        workspace: wsApex2._id,
        assignedTo: david._id,
        createdBy: apexAdmin._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },

      // -----------------------------------------------------------------------
      // STELLAR DYNAMICS TASKS
      // -----------------------------------------------------------------------
      // --- Stellar Workspace 1: Orbital Constellation Telemetry ---
      {
        title: 'Decode CCSDS Space Telemetry Frame Format',
        description: 'Parse frame headers, timestamp synchronization, and Reed-Solomon error correction.',
        status: 'Completed',
        priority: 'High',
        workspace: wsStellar1._id,
        assignedTo: tariq._id,
        createdBy: stellarAdmin._id,
        createdAt: daysAgo(6),
        updatedAt: daysAgo(4)
      },
      {
        title: 'Compute SGP4 Orbit Propagation Ephemeris',
        description: 'Calculate two-line element set (TLE) orbital vectors for ground station dish tracking.',
        status: 'In Progress',
        priority: 'High',
        workspace: wsStellar1._id,
        assignedTo: chloe._id,
        createdBy: stellarAdmin._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Automate Ground Station Antenna Handover Matrix',
        description: 'Seamless handover between ground stations in Svalbard and Santiago.',
        status: 'To Do',
        priority: 'Medium',
        workspace: wsStellar1._id,
        assignedTo: tariq._id,
        createdBy: stellarAdmin._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },

      // --- Stellar Workspace 2: Mission Control Dashboard ---
      {
        title: 'Render Real-Time Three.js 3D Globe with Satellite Trajectories',
        description: 'WebGL accelerated globe showing orbital ground tracks and coverage cones.',
        status: 'Completed',
        priority: 'High',
        workspace: wsStellar2._id,
        assignedTo: lucas._id,
        createdBy: stellarAdmin._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(3)
      },
      {
        title: 'Develop Mission Critical Anomaly Banner Notification',
        description: 'Audio and visual flashing alerts when battery thermal thresholds exceed limits.',
        status: 'In Progress',
        priority: 'High',
        workspace: wsStellar2._id,
        assignedTo: chloe._id,
        createdBy: stellarAdmin._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Export Mission Pass History to CSV/PDF',
        description: 'Generate compliance audit reports for orbital frequency licensing authorities.',
        status: 'To Do',
        priority: 'Low',
        workspace: wsStellar2._id,
        assignedTo: lucas._id,
        createdBy: stellarAdmin._id,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      },

      // -----------------------------------------------------------------------
      // PULSE HEALTH TECH TASKS
      // -----------------------------------------------------------------------
      // --- Pulse Workspace 1: HIPAA Clinical Records Sync ---
      {
        title: 'Implement FHIR R4 Patient Resource Ingestion API',
        description: 'Sanitize and import electronic health records adhering to HL7 standards.',
        status: 'Completed',
        priority: 'High',
        workspace: wsPulse1._id,
        assignedTo: maya._id,
        createdBy: pulseAdmin._id,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(5)
      },
      {
        title: 'Configure AES-256 Field-Level Encryption on Patient Identifiers',
        description: 'Encrypt social security numbers and diagnostic records at rest with envelope encryption.',
        status: 'In Progress',
        priority: 'High',
        workspace: wsPulse1._id,
        assignedTo: carlos._id,
        createdBy: pulseAdmin._id,
        createdAt: daysAgo(4),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Perform Quarterly HIPAA Access Control Security Audit',
        description: 'Review access logs and privilege separation between clinical staff and system admins.',
        status: 'To Do',
        priority: 'Medium',
        workspace: wsPulse1._id,
        assignedTo: maya._id,
        createdBy: pulseAdmin._id,
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2)
      },

      // --- Pulse Workspace 2: Wearable IoT Vitals Streaming ---
      {
        title: 'Process BLE Heart Rate Variability (HRV) Packets',
        description: 'Real-time calculation of SDNN and RMSSD stress metrics from sensor stream.',
        status: 'Completed',
        priority: 'High',
        workspace: wsPulse2._id,
        assignedTo: zainab._id,
        createdBy: pulseAdmin._id,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(3)
      },
      {
        title: 'Develop Real-Time Arrhythmia Alert Push Service',
        description: 'Trigger clinician SMS alerts via Twilio when abnormal rhythm is sustained for >60s.',
        status: 'In Progress',
        priority: 'High',
        workspace: wsPulse2._id,
        assignedTo: carlos._id,
        createdBy: pulseAdmin._id,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(1)
      },
      {
        title: 'Calibrate Battery Consumption Profile for 24-Hour Wearables',
        description: 'Optimize BLE transmission intervals to extend battery life up to 72 hours.',
        status: 'To Do',
        priority: 'Low',
        workspace: wsPulse2._id,
        assignedTo: zainab._id,
        createdBy: pulseAdmin._id,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1)
      }
    ];

    for (const t of tasksToInsert) {
      const taskDoc = new Task(t);
      // Preserve custom timestamps for realistic analytics
      taskDoc.createdAt = t.createdAt;
      taskDoc.updatedAt = t.updatedAt;
      await taskDoc.save();
    }

    console.log(`Successfully seeded ${tasksToInsert.length} tasks across 9 workspaces and 4 organizations!`);

    // =========================================================================
    // Credentials & Summary Display
    // =========================================================================
    console.log('\n=============================================================');
    console.log('       MULTI-TENANT ORGANIZATIONS SEEDING COMPLETE           ');
    console.log('=============================================================');

    console.log('\n[ORG 1] Nexus Enterprise (ID: ORG-NEXUS-01 | Plan: Enterprise)');
    console.log('  Admin:');
    console.log('    Name:     Nexus Root Admin');
    console.log('    Email:    superadmin@admin.nexus.in');
    console.log('    Password: AdminRoot123!');
    console.log('  Employees (Password for all: EmpPass123!):');
    console.log('    - rahul.sharma@emp.nexus.in');
    console.log('    - priya.patel@emp.nexus.in');
    console.log('    - ananya.singh@emp.nexus.in');
    console.log('    - vikram.verma@emp.nexus.in');
    console.log('    - neha.gupta@emp.nexus.in');
    console.log('  Workspaces: Sprint 1 - Core Services, UI/UX Redesign, Cloud Infrastructure');

    console.log('\n[ORG 2] Apex Global Labs (ID: ORG-APEX-02 | Plan: Enterprise)');
    console.log('  Admin:');
    console.log('    Name:     Marcus Vance');
    console.log('    Email:    marcus.vance@admin.apexlabs.io');
    console.log('    Password: ApexAdmin123!');
    console.log('  Employees (Password for all: EmpPass123!):');
    console.log('    - elena.rostova@emp.apexlabs.io');
    console.log('    - david.kim@emp.apexlabs.io');
    console.log('    - sophia.martinez@emp.apexlabs.io');
    console.log('    - arjun.mehta@emp.apexlabs.io');
    console.log('  Workspaces: Autonomous AI Inference Engine, Edge Device SDK');

    console.log('\n[ORG 3] Stellar Dynamics (ID: ORG-STELLAR-03 | Plan: Pro)');
    console.log('  Admin:');
    console.log('    Name:     Sarah Jenkins');
    console.log('    Email:    sarah.jenkins@admin.stellardynamics.com');
    console.log('    Password: StellarAdmin123!');
    console.log('  Employees (Password for all: EmpPass123!):');
    console.log('    - tariq.mansoor@emp.stellardynamics.com');
    console.log('    - chloe.dubois@emp.stellardynamics.com');
    console.log('    - lucas.silva@emp.stellardynamics.com');
    console.log('  Workspaces: Orbital Constellation Telemetry, Mission Control Dashboard');

    console.log('\n[ORG 4] Pulse Health Tech (ID: ORG-PULSE-04 | Plan: Enterprise)');
    console.log('  Admin:');
    console.log('    Name:     Dr. Arthur Pendelton');
    console.log('    Email:    arthur.pendelton@admin.pulsehealth.io');
    console.log('    Password: PulseAdmin123!');
    console.log('  Employees (Password for all: EmpPass123!):');
    console.log('    - maya.lin@emp.pulsehealth.io');
    console.log('    - carlos.mendez@emp.pulsehealth.io');
    console.log('    - zainab.khan@emp.pulsehealth.io');
    console.log('  Workspaces: HIPAA Clinical Records Sync, Wearable IoT Vitals Streaming');

    console.log('\n=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
