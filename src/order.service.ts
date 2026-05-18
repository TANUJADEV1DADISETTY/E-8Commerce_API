import prisma from './db';
import { Prisma } from '@prisma/client';

export class OrderService {
  /**
   * Creates an order with items, checking inventory and recording payment in a single transaction.
   * Optimistic locking is used to handle concurrent stock updates.
   */
  async createOrder(userId: number, items: { productId: number; quantity: number }[]) {
    console.log(`[TRANSACTION_START] Creating order for user ${userId}`);

    try {
      // Run within an interactive transaction to ensure ACID properties
      const result = await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const orderItemsToCreate: any[] = [];

        for (const item of items) {
          // 1. Fetch product to check stock and version
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });

          if (!product) {
            console.warn(`[INVENTORY_CHECK_FAILURE] Product ${item.productId} not found.`);
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.stock < item.quantity) {
            console.warn(`[INVENTORY_CHECK_FAILURE] Insufficient stock for product ${item.productId}. Requested: ${item.quantity}, Available: ${product.stock}`);
            throw new Error(`Insufficient stock for product ${item.productId}`);
          }

          console.log(`[INVENTORY_CHECK_SUCCESS] Product ${item.productId} has sufficient stock.`);

          // 2. Update stock using optimistic locking
          const updatedProduct = await tx.product.updateMany({
            where: {
              id: item.productId,
              version: product.version, // optimistic lock check
              stock: {
                gte: item.quantity // double check stock just in case
              }
            },
            data: {
              stock: product.stock - item.quantity,
              version: product.version + 1
            }
          });

          if (updatedProduct.count === 0) {
            console.error(`[CONCURRENCY_ERROR] Optimistic lock failure for product ${item.productId}.`);
            throw new Error(`Concurrency error: product ${item.productId} was updated by another transaction.`);
          }

          const itemTotal = Number(product.price) * item.quantity;
          totalAmount += itemTotal;

          orderItemsToCreate.push({
            productId: item.productId,
            quantity: item.quantity,
            price: product.price
          });
        }

        // 3. Create the order
        const order = await tx.order.create({
          data: {
            userId,
            status: 'processing',
            totalAmount,
            items: {
              create: orderItemsToCreate
            },
            payments: {
              create: {
                amount: totalAmount,
                status: 'succeeded'
              }
            }
          },
          include: {
            items: true
          }
        });

        console.log(`[PAYMENT_SUCCESS] Payment simulated and succeeded for order ${order.id}.`);
        console.log(`[TRANSACTION_COMMIT] Order ${order.id} created successfully.`);
        
        return order;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 5000,
        timeout: 10000
      });

      return result;
    } catch (error: any) {
      console.error(`[TRANSACTION_ROLLBACK] Order creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancels an order, updates its status, and restores product inventory in a transaction.
   * Idempotent operation: if already cancelled, it simply returns success.
   */
  async cancelOrder(orderId: number) {
    console.log(`[TRANSACTION_START] Cancelling order ${orderId}`);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch order and its items
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { items: true }
        });

        if (!order) {
          throw new Error(`Order ${orderId} not found`);
        }

        // 2. Idempotency check
        if (order.status === 'cancelled') {
          console.log(`[IDEMPOTENT_SUCCESS] Order ${orderId} is already cancelled.`);
          return order; // No need to do anything further
        }

        // 3. Status validity check
        if (order.status === 'shipped' || order.status === 'delivered') {
          throw new Error(`Cannot cancel order in status: ${order.status}`);
        }

        // 4. Update order status to 'cancelled'
        const cancelledOrder = await tx.order.update({
          where: { id: orderId },
          data: { status: 'cancelled' }
        });

        // 5. Restore inventory
        for (const item of order.items) {
          // Assuming cancellation is safe from race conditions, but we can still use optimistic locking 
          // or atomic increment here. Atomic increment is safest for restoring stock.
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              version: { increment: 1 }
            }
          });
          console.log(`[INVENTORY_RESTORED] Restored ${item.quantity} to product ${item.productId}.`);
        }

        console.log(`[TRANSACTION_COMMIT] Order ${orderId} cancelled successfully.`);
        return cancelledOrder;
      });

      return result;
    } catch (error: any) {
      console.error(`[TRANSACTION_ROLLBACK] Order cancellation failed: ${error.message}`);
      throw error;
    }
  }
}

export const orderService = new OrderService();
