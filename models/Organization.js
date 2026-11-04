const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrganizationSchema = new Schema(
  {
    // Primary Business Identifier (OrgId PK)
    orgId: {
      type: String,
      required: [true, 'Organization ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },

    // Organization Name (Orgname)
    orgName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      unique: true
    },

    // URL-friendly identifier for subdomain/routes (e.g., 'nexus-corp')
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true
    },

    // Brief description of the organization
    description: {
      type: String,
      trim: true,
      default: ''
    },

    // Primary corporate owner (ref: User)
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Allowed corporate email domains (e.g., ['nexus.in', 'emp.nexus.in'])
    // Replaces hardcoded domain checks in authRoutes.js
    allowedDomains: [
      {
        type: String,
        lowercase: true,
        trim: true
      }
    ],

    // Organization members with their organization-level roles
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        role: {
          type: String,
          enum: ['Owner', 'Admin', 'Member'],
          default: 'Member'
        },
        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Corporate branding & contact
    logoUrl: {
      type: String,
      trim: true,
      default: ''
    },
    website: {
      type: String,
      trim: true,
      default: ''
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },

    // Subscription Tier & Capacity Limits
    plan: {
      type: String,
      enum: ['Free', 'Starter', 'Pro', 'Enterprise'],
      default: 'Enterprise'
    },
    maxMembers: {
      type: Number,
      default: 50
    },
    maxWorkspaces: {
      type: Number,
      default: 10
    },

    // Account Lifecycle Status
    status: {
      type: String,
      enum: ['Active', 'Suspended', 'Deactivated'],
      default: 'Active'
    },

    // Audit field: Who initiated the creation
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true // Automatically manages createdAt and updatedAt
  }
);

// Auto-generate URL slug from orgName before saving if not explicitly specified
OrganizationSchema.pre('save', function () {
  if (this.orgName && !this.slug) {
    this.slug = this.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
});

const Organization = mongoose.model('Organization', OrganizationSchema);

module.exports = Organization;

