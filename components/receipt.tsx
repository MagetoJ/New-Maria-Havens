// components/receipt.tsx
import React from 'react';
import { Order, OrderItem } from './restaurant-pos'; // Adjust this import path as needed

interface ReceiptProps {
  order?: Order;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ order }, ref) => {
  if (!order) return null;

  return (
    <div ref={ref} className="p-8 text-black bg-white w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Maria Havens</h2>
        <p className="text-sm">Hotel & Restaurant</p>
        <p className="text-xs mt-2">123 Uhuru Highway, Nairobi, Kenya</p>
        <p className="text-xs">info@mariahavens.com | +254 700 123 456</p>
      </div>

      <div className="border-t border-b border-dashed py-4 mb-4">
        <p className="text-sm font-semibold">Order ID: {order.id}</p>
        <p className="text-xs">Table: {order.table}</p>
        {order.customer_name && <p className="text-xs">Customer: {order.customer_name}</p>}
        <p className="text-xs">Date: {order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString()}</p>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-xs font-semibold">
          <span>Item</span>
          <span>Qty</span>
          <span>Price</span>
        </div>
        {order.items.map((item: OrderItem) => (
          <div key={item.id} className="flex justify-between text-xs">
            <span>{item.name}</span>
            <span>{item.quantity}</span>
            <span>KSh {(parseFloat(item.price.toString()) * item.quantity).toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed pt-4">
        <div className="flex justify-between text-sm font-bold">
          <span>Total:</span>
          <span>KSh {order.total_amount ? parseFloat(order.total_amount).toLocaleString() : 
            order.items.reduce((total, item) => total + (parseFloat(item.price.toString()) * item.quantity), 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center text-xs mt-6">
        <p>Thank you for dining with us!</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";