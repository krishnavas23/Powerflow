const express = require('express');
const router = express.Router();
const { uploadEnergy, buyEnergy, getActiveListings, donateSurplusEnergy, getMyDonations, getListingReceiptPdf, getDonationReceiptPdf, getBuyingLimit } = require('../../controllers/user/energyController');
const auth = require('../../middleware/auth');

router.get('/listings', auth, getActiveListings);
router.get('/buying-limit', auth, getBuyingLimit);
router.post('/upload', auth, uploadEnergy);
router.post('/buy', auth, buyEnergy);
router.post('/donate', auth, donateSurplusEnergy);
router.get('/my-donations', auth, getMyDonations);

// Public downloadable receipt for a listing
router.get('/receipt/:listingId.pdf', getListingReceiptPdf);

// Public downloadable receipt for a donation
router.get('/receipt/donation/:donationId.pdf', getDonationReceiptPdf);

module.exports = router;
