import express from 'express';
import { AttractionsController } from '../controllers/attractionsController';

const router = express.Router();

router.get('/get_products', AttractionsController.getProducts);
router.get('/get_product_options', AttractionsController.getProductOptions);
router.get('/get_product_options/:id', AttractionsController.getProductOptions);
router.get('/get_product_info',  AttractionsController.getProductInfo);
router.get('/get_product_info/:id', AttractionsController.getProductInfo);
router.get('/get_event_dates', AttractionsController.getEventDates);
router.get('/get_event_availability', AttractionsController.getEventAvailability);
router.get('/get_event_unavailabledates', AttractionsController.getEventUnavailableDates);
router.get('/check_event_changes', AttractionsController.checkEventChanges);
router.post('/create_transaction', AttractionsController.createTransaction);
router.get('/cancel_transaction', AttractionsController.cancelTransaction);
router.post('/hydrate_transactions', AttractionsController.hydrateTransactions);
router.get('/get_balance', AttractionsController.getBalance);
router.post('/request_booking_approval', AttractionsController.requestBookingApproval);

export default router;