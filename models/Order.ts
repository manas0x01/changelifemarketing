import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId?: string;
  username?: string;
  name: string;
  mobileNumber: string;
  transactionDetails: string;
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
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    transactionDetails: {
      type: String,
      required: true,
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
