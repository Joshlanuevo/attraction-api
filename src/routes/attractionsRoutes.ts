import express from 'express';
import { AttractionsController } from '../controllers/attractionsController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = express.Router();

// Public endpoints (no authentication required)
router.get('/get_products', AttractionsController.getProducts);
router.get('/get_product_options', AttractionsController.getProductOptions);
router.get('/get_product_options/:id', AttractionsController.getProductOptions);
router.get('/get_event_dates', AttractionsController.getEventDates);
router.get('/get_event_availability', AttractionsController.getEventAvailability);
router.get('/get_event_unavailable_dates', AttractionsController.getEventUnavailableDates);
router.get('/check_event_changes', AttractionsController.checkEventChanges);
router.get('/get_balance', AttractionsController.getBalance);

// Protected endpoints (require user to be logged in)
router.get('/get_product_info', authenticateJWT, AttractionsController.getProductInfo);
router.get('/get_product_info/:id', authenticateJWT, AttractionsController.getProductInfo);
router.post('/create_transaction', authenticateJWT, AttractionsController.createTransaction);
router.post('/cancel_transaction', authenticateJWT, AttractionsController.cancelTransaction);
router.post('/request_booking_approval', authenticateJWT, AttractionsController.requestBookingApproval);

// Admin-only (still requires user to be authenticated, admin check done in controller)
router.post('/hydrate_transactions', authenticateJWT, AttractionsController.hydrateTransactions);

export default router;