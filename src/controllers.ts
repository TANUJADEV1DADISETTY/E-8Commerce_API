import { Request, Response } from 'express';
import prisma from './db';
import { orderService } from './order.service';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', db: 'healthy' });
  } catch (error) {
    res.status(503).json({ status: 'error', db: 'unhealthy' });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: 'asc' }
    });
    // Transform decimal to number for JSON response format
    const transformed = products.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      stock: p.stock
    }));
    res.status(200).json(transformed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const { userId, items } = req.body;

  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const order = await orderService.createOrder(Number(userId), items.map(i => ({
      productId: Number(i.productId),
      quantity: Number(i.quantity)
    })));

    res.status(201).json({
      orderId: order.id,
      status: order.status,
      totalAmount: Number(order.totalAmount)
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getOrderDetails = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({
      orderId: order.id,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt.toISOString(),
      user: {
        id: order.user.id,
        email: order.user.email
      },
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.price)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  try {
    const cancelledOrder = await orderService.cancelOrder(Number(orderId));
    res.status(200).json({
      orderId: cancelledOrder.id,
      status: cancelledOrder.status
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
