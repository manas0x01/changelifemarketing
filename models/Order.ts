import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId?: string;
  username?: string;
  name?: string;
  mobileNumber?: string;
  transactionDetails: string;
  transactionId?: string;
  email?: string;
  screenshotUrl?: string;
  amount?: number;
  packageName?: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  packId?: string;
  packName?: string;
  packPrice?: number;
  quantity?: number;
  orderType: 'product' | 'pack';
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      default: null,
      index: true,
    },
    username: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    mobileNumber: {
      type: String,
      default: null,
      match: /^[0-9]{10}$/,
    },
    transactionDetails: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    screenshotUrl: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      default: null,
    },
    packageName: {
      type: String,
      default: null,
    },
    productId: {
      type: String,
      default: null,
    },
    productName: {
      type: String,
      default: null,
    },
    productPrice: {
      type: Number,
      default: null,
    },
    packId: {
      type: String,
      default: null,
    },
    packName: {
      type: String,
      default: null,
    },
    packPrice: {
      type: Number,
      default: null,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    orderType: {
      type: String,
      enum: ['product', 'pack'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);
const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
