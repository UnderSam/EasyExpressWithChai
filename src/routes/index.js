import { Router } from 'express';
import ProductController from '../controllers/productController.js';
const routes = Router();
routes.get('/', ProductController.getAllProducts);
routes.get('/:id', ProductController.getSingleProduct);
export default routes;