import express, {Request, Response } from 'express';
import { FirebaseLib } from '../lib/FirebaseLib';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { AttractionsController } from '../controllers/attractionsController';
import { hash, unhash } from '../utils/cryptoUtil';

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
    const approverId = 'test-approver-id';
    const approverHash = await hash(`${approverId}|${requestId}`);
    
    // Create the entry in Firebase
    const firebase = new FirebaseLib();
    await firebase.setData(
      FirebaseCollections.booking_approvals,
      requestId,
      {
        id: requestId,
        status: 0,
        timestamp: new Date().toISOString(),
        approved_by: null,
        meta: {
          applicant_name: "Test User",
          applicant_id: "test-user-id",
          amount_requested: "PHP 125",
          request_id: requestId,
          details_table: "<tr><td>Test</td><td>Data</td></tr>",
        }
      }
    );
    
    res.json({
      requestId,
      approverHash,
      approval_link: `http://localhost:3000/api/event_packages/approve_booking_request?hash=${approverHash}`,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/approve_booking_request', async (req: Request, res: Response) => {
  try {
    const hash = req.query.hash as string;
    if (!hash) {
      throw new Error("Hash is required");
    }
    
    const requestId = await unhash(hash);
    if (!requestId || hash === requestId) {
      throw new Error("Invalid hash");
    }
    
    // Get the booking request from Firebase
    const firebase = new FirebaseLib();
    const bookingRequest = await firebase.getData(
      FirebaseCollections.booking_approvals,
      requestId
    );
    
    if (!bookingRequest) {
      throw new Error("Request does not exist");
    }
    
    // Update the status in Firebase
    await firebase.setData(
      FirebaseCollections.booking_approvals,
      requestId,
      {
        ...bookingRequest,
        status: 1,
        timestamp: new Date().toISOString(),
        approved_by: "test-approver"
      }
    );
    
    // Return a simple HTML response
    const html = `
      <html>
        <body>
          <h1>Booking Request Approved</h1>
          <p>Request ID: ${requestId}</p>
          <p>Status: Approved</p>
        </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(400).json({ 
      error: error instanceof Error ? error.message : String(error),
      trace: error instanceof Error ? error.stack : ''
    });
  }
});

export default router;