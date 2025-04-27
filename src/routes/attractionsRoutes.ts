import express, {Request, Response } from 'express';
import { AttractionsController } from '../controllers/attractionsController';
import { BookingApprovalService } from '../services/bookingApprovalService';

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

// For testing
router.get('/generate_test_hash', async (req: Request, res: Response) => {
    try {
      const requestId = req.query.requestId as string || `test-${Date.now()}`;
      const hash = await BookingApprovalService.hash(requestId);
      
      res.json({
        requestId,
        hash
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
});

router.get('/check_session', (req: Request, res: Response) => {
    if (req.session && req.session.user) {
      res.json({
        authenticated: true,
        userId: req.session.user.id,
        sessionExists: true,
      });
    } else {
      res.json({
        authenticated: false,
        sessionExists: !!req.session,
      });
    }
});

export default router;