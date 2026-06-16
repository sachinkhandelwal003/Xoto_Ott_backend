import mongoose, { Schema, Document } from 'mongoose';

export interface IModulePermissions {
  movies: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
  genres: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
  actors: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
  directors: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
  languages: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
  categories: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
  mediaLibrary: { canView: boolean; canUpload: boolean; canDelete: boolean };
  banners: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
  promotions: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
}

export interface IAdminUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: 'superadmin' | 'admin' | 'moderator' | 'influencer';
  avatar?: string;
  phone?: string;
  modulePermissions: IModulePermissions;
  isActive: boolean;
  lastLogin?: Date;
  loginCount: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const defaultModulePermissions: IModulePermissions = {
  movies: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  genres: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  actors: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  directors: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  languages: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  categories: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  mediaLibrary: { canView: true, canUpload: false, canDelete: false },
  banners: { canView: true, canCreate: false, canEdit: false, canDelete: false },
  promotions: { canView: true, canCreate: false, canEdit: false, canDelete: false },
};

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'moderator', 'influencer'],
      default: 'influencer',
    },
    avatar: String,
    phone: String,
    modulePermissions: {
      type: {
        movies: { canView: Boolean, canCreate: Boolean, canEdit: Boolean, canDelete: Boolean },
        genres: { canView: Boolean, canCreate: Boolean, canEdit: Boolean, canDelete: Boolean },
        actors: { canView: Boolean, canCreate: Boolean, canEdit: Boolean, canDelete: Boolean },
        directors: { canView: Boolean, canCreate: Boolean, canEdit: Boolean, canDelete: Boolean },
        languages: { canView: Boolean, canCreate: Boolean, canEdit: Boolean, canDelete: Boolean },
        categories: { canView: Boolean, canCreate: Boolean, canEdit: Boolean, canDelete: Boolean },
        mediaLibrary: { canView: Boolean, canUpload: Boolean, canDelete: Boolean },
        banners: { canView: Boolean, canCreate: Boolean, canEdit: Boolean, canDelete: Boolean },
        promotions: { canView: Boolean, canCreate: Boolean, canEdit: Boolean, canDelete: Boolean },
      },
      default: defaultModulePermissions,
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const AdminUserModel = mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
