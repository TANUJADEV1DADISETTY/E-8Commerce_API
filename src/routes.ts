import { Router } from 'express';
import { healthCheck, getProducts, createOrder, getOrderDetails, cancelOrder } from './controllers';

const router = Router();

router.get('/health', healthCheck);
router.get('/api/products', getProducts);
router.post('/api/orders', createOrder);
router.get('/api/orders/:orderId', getOrderDetails);
router.put('/api/orders/:orderId/cancel', cancelOrder);

export default router;
