const asyncHandler = require('express-async-handler');
const EnergyListing = require('../../models/EnergyListing');
const Transaction = require('../../models/Transaction');
const Wallet = require('../../models/Wallet');
const Donation = require('../../models/Donation');
const User = require('../../models/User');
const { checkBuyingLimit, calculateBuyingLimit } = require('../../utils/buyingLimits');

// ------------------------------
// POST /api/energy/upload
// ------------------------------
exports.uploadEnergy = asyncHandler(async (req, res) => {
  console.log("Decoded user from token:", req.user);

  const userId = req.user._id;
  const { kwhAvailable, minPrice, maxPrice, demandPrice, source, location } = req.body;

  // ✅ Only Producers can upload
  if (req.user.role !== 'Producer') {
    res.status(403);
    throw new Error('Only Producers can upload energy.');
  }

  if (!kwhAvailable || kwhAvailable <= 0) {
    res.status(400);
    throw new Error('Invalid kWh amount.');
  }

  // ✅ Create a new energy listing
  const listing = await EnergyListing.create({
    seller: userId,
    kwhAvailable,
    minPrice,
    maxPrice,
    demandPrice,
    source,
    location,
    status: 'ACTIVE',
  });

  // Optional: log upload as a transaction
  await Transaction.create({
    type: 'UPLOAD_ENERGY',
    seller: userId,
    buyer: null,
    kwh: kwhAvailable,
    totalAmount: 0,
    status: 'PENDING',
  });

  // Send confirmation email with PDF receipt (non-blocking best-effort)
  try {
    const nodemailer = require('nodemailer');
    const PDFDocument = require('pdfkit');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.on('data', (d) => chunks.push(d));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      await transporter.sendMail({
        from: `Powerflow Support <${process.env.EMAIL_USER}>`,
        to: req.user.email,
        subject: 'Energy Listing Created - Receipt',
        html: `<p>Hi ${req.user.name || ''},</p>
               <p>Your energy listing has been created successfully.</p>
               <p><b>${kwhAvailable} kWh</b> at demand price ₹${demandPrice}/kWh.</p>
               <p>Listing ID: ${listing._id}</p>
               <p>Thank you for using Powerflow.</p>`,
        attachments: [{ filename: `powerflow-listing-${listing._id}.pdf`, content: pdfBuffer }],
      });
    });
    doc.fontSize(18).text('Powerflow - Energy Listing Receipt');
    doc.moveDown().fontSize(12).text(`Listing ID: ${listing._id}`);
    doc.text(`Seller: ${req.user.name || req.user.email}`);
    doc.text(`Email: ${req.user.email}`);
    doc.moveDown();
    doc.text(`kWh Listed: ${kwhAvailable}`);
    doc.text(`Min Price: ₹${minPrice}/kWh`);
    doc.text(`Max Price: ₹${maxPrice}/kWh`);
    doc.text(`Demand Price: ₹${demandPrice}/kWh`);
    doc.text(`Source: ${source || ''}`);
    doc.text(`Location: ${location || ''}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.end();
  } catch (e) {
    console.error('Listing receipt email failed:', e.message);
  }

  res.status(201).json({
    success: true,
    message: `Energy listing of ${kwhAvailable} kWh created successfully. Waiting for buyers.`,
    listing,
  });
});

// ------------------------------
// POST /api/energy/buy
// ------------------------------
exports.buyEnergy = asyncHandler(async (req, res) => {
  const buyerId = req.user._id;
  const { listingId, quantity } = req.body;

  if (!listingId || !quantity || quantity <= 0) {
    res.status(400);
    throw new Error("Invalid request data.");
  }

  // ✅ Only Buyers can buy (case-insensitive)
  if (String(req.user.role || '').toLowerCase() !== 'buyer') {
    res.status(403);
    throw new Error("Only Buyers can buy energy.");
  }

  // ✅ Fetch listing
  const listing = await EnergyListing.findById(listingId);
  if (!listing) {
    res.status(404);
    throw new Error("Listing not found.");
  }

  if (listing.kwhAvailable < quantity) {
    res.status(400);
    throw new Error("Not enough energy available.");
  }

  // ✅ Check daily buying limit
  const limitCheck = await checkBuyingLimit(req.user, quantity);
  if (!limitCheck.allowed) {
    res.status(400);
    throw new Error(limitCheck.error);
  }

  // ✅ Calculate total INR amount
  const totalAmount = quantity * listing.demandPrice;

  // ✅ Fetch wallets
  const buyerWallet = await Wallet.findOne({ userId: buyerId });
  const sellerWallet = await Wallet.findOne({ userId: listing.seller });

  if (!buyerWallet || !sellerWallet) {
    res.status(400);
    throw new Error("Wallet not found.");
  }

  // ⚠️ FIX 1: Correct field name — walletBalance (not walletbalance)
  if (buyerWallet.walletBalance < totalAmount) {
    res.status(400);
    throw new Error("Insufficient INR balance.");
  }

  // ✅ Update wallets
  buyerWallet.walletBalance -= totalAmount;     // deduct INR from buyer
  sellerWallet.energyCredits += quantity;       // credit EC to seller

  await buyerWallet.save();
  await sellerWallet.save();

  // Keep User document fields in sync with Wallets
  await User.findByIdAndUpdate(buyerId, { walletBalance: buyerWallet.walletBalance });
  await User.findByIdAndUpdate(listing.seller, { energyCredits: sellerWallet.energyCredits });

  // ✅ Update listing
  listing.kwhAvailable -= quantity;
  if (listing.kwhAvailable <= 0) listing.status = "SOLD";
  await listing.save();

  // ✅ Create transaction
  const tx = await Transaction.create({
    type: "TRADE",
    buyer: buyerId,
    seller: listing.seller,
    kwh: quantity,
    totalAmount,
    status: "COMPLETED",
  });

  // Email notifications and receipt
  try {
    const nodemailer = require('nodemailer');
    const PDFDocument = require('pdfkit');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    // Build receipt PDF in memory
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.on('data', (d) => chunks.push(d));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      // Send to buyer
      const buyer = await User.findById(buyerId).lean();
      await transporter.sendMail({
        from: `Powerflow Support <${process.env.EMAIL_USER}>`,
        to: buyer?.email,
        subject: 'Purchase Confirmation - Powerflow Energy',
        html: `<p>Hi ${buyer?.name || ''},</p>
               <p>Your purchase was successful.</p>
               <p><b>${quantity} kWh</b> at ₹${listing.demandPrice}/kWh (Total ₹${totalAmount.toFixed(2)}).</p>
               <p>Transaction: ${tx._id}</p>
               <p>Thank you for using Powerflow.</p>`,
        attachments: [{ filename: `powerflow-trade-${tx._id}.pdf`, content: pdfBuffer }],
      });
      // Notify seller (no attachment necessary)
      const seller = await User.findById(listing.seller).lean();
      if (seller?.email) {
        await transporter.sendMail({
          from: `Powerflow Support <${process.env.EMAIL_USER}>`,
          to: seller.email,
          subject: 'Energy Credits Added - Powerflow',
          html: `<p>Hi ${seller?.name || ''},</p>
                 <p>Your listing received a purchase of <b>${quantity} kWh</b>.</p>
                 <p>We have added <b>${quantity} EC</b> to your account.</p>
                 <p>Transaction: ${tx._id}</p>`,
        });
      }
    });
    doc.fontSize(18).text('Powerflow Trade Receipt');
    doc.moveDown().fontSize(12);
    doc.text(`Transaction: ${tx._id}`);
    doc.text(`Listing: ${listing._id}`);
    doc.text(`Seller: ${String(listing.seller)}`);
    doc.text(`Buyer: ${String(buyerId)}`);
    doc.moveDown();
    doc.text(`Quantity: ${quantity} kWh`);
    doc.text(`Unit Price: ₹${listing.demandPrice}/kWh`);
    doc.text(`Total Paid: ₹${totalAmount.toFixed(2)}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.end();
  } catch (e) {
    console.error('Trade email send failed:', e.message);
  }

  // ✅ Respond
  res.status(200).json({
    success: true,
    message: `Successfully bought ${quantity} kWh for ₹${totalAmount}.`,
    listing,
    buyerNewBalance: buyerWallet.walletBalance,
    sellerNewEnergyCredits: sellerWallet.energyCredits,
    transactionId: tx._id,
  });
});

// ------------------------------
// GET /api/energy/listings
// ------------------------------
exports.getActiveListings = asyncHandler(async (req, res) => {
  const listings = await EnergyListing.find({
    status: "ACTIVE",
    kwhAvailable: { $gt: 0 },
  })
    .populate("seller", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: listings.length,
    listings,
  });
});

// Download printable receipt for a listing
exports.getListingReceiptPdf = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const listing = await EnergyListing.findById(listingId).populate('seller', 'name email');
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }

  const PDFDocument = require('pdfkit');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="powerflow-listing-${listing._id}.pdf"`);
  const doc = new (require('pdfkit'))({ size: 'A4', margin: 50 });
  doc.pipe(res);
  doc.fontSize(18).text('Powerflow - Energy Listing Receipt');
  doc.moveDown().fontSize(12).text(`Listing ID: ${listing._id}`);
  doc.text(`Seller: ${listing.seller?.name || listing.seller?.email || listing.seller}`);
  doc.text(`Email: ${listing.seller?.email || ''}`);
  doc.moveDown();
  doc.text(`kWh Listed: ${listing.kwhAvailable}`);
  doc.text(`Min Price: ₹${listing.minPrice}/kWh`);
  doc.text(`Max Price: ₹${listing.maxPrice}/kWh`);
  doc.text(`Demand Price: ₹${listing.demandPrice}/kWh`);
  doc.text(`Source: ${listing.source || ''}`);
  doc.text(`Location: ${listing.location || ''}`);
  doc.text(`Date: ${new Date(listing.createdAt).toLocaleString()}`);
  doc.end();
});


// POST /api/energy/donate

exports.donateSurplusEnergy = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { kwh, beneficiary, source, location } = req.body;

  if (!kwh || kwh <= 0 || !beneficiary) {
    res.status(400);
    throw new Error("Invalid donation data.");
  }

  // ✅ Only Producers can donate energy
  if (req.user.role !== "Producer") {
    res.status(403);
    throw new Error("Only Producers can donate energy.");
  }

  // ✅ Ensure wallet exists and donor has enough energy credits
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) wallet = await Wallet.create({ userId });
  if (wallet.energyCredits < kwh) {
    res.status(400);
    throw new Error('Insufficient energy credits to donate.');
  }

  // ✅ Deduct energy credits from donor
  wallet.energyCredits -= kwh;
  await wallet.save();

  // Keep User doc in sync with wallet
  await User.findByIdAndUpdate(userId, { energyCredits: wallet.energyCredits });

  // ✅ Create a new Donation record
  const donation = await Donation.create({
    donor: userId,
    beneficiary,
    kwh,
    source,
    location,
    status: "COMPLETED",
  });

  // ✅ Create a Transaction record for logging
  const tx = await Transaction.create({
    type: "DONATION",
    seller: userId,
    buyer: null,
    kwh,
    totalAmount: 0,
    status: "COMPLETED",
  });

  // Send confirmation email with PDF receipt (non-blocking)
  try {
    const nodemailer = require('nodemailer');
    const PDFDocument = require('pdfkit');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.on('data', (d) => chunks.push(d));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const donor = await User.findById(userId).lean();
      await transporter.sendMail({
        from: `Powerflow Support <${process.env.EMAIL_USER}>`,
        to: donor?.email,
        subject: 'Donation Confirmation - Powerflow',
        html: `<p>Hi ${donor?.name || ''},</p>
               <p>Thank you for your generous donation!</p>
               <p>You donated <b>${kwh} EC</b> to <b>${beneficiary}</b>.</p>
               <p>Donation ID: ${donation._id}</p>
               <p>Your contribution helps power communities in need.</p>`,
        attachments: [{ filename: `powerflow-donation-${donation._id}.pdf`, content: pdfBuffer }],
      });
    });
    doc.fontSize(18).text('Powerflow - Donation Receipt');
    doc.moveDown().fontSize(12);
    doc.text(`Donation ID: ${donation._id}`);
    doc.text(`Donor: ${req.user.name || req.user.email}`);
    doc.text(`Email: ${req.user.email}`);
    doc.moveDown();
    doc.text(`Beneficiary: ${beneficiary}`);
    doc.text(`Energy Donated: ${kwh} EC`);
    doc.text(`Source: ${source || ''}`);
    doc.text(`Location: ${location || ''}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(10).text('Thank you for your generous contribution!', { align: 'center' });
    doc.end();
  } catch (e) {
    console.error('Donation email send failed:', e.message);
  }

  res.status(200).json({
    success: true,
    message: `Successfully donated ${kwh} kWh to ${beneficiary}.`,
    donation,
    donorEnergyCredits: wallet.energyCredits,
    donationId: donation._id,
  });
});


// GET /api/energy/my-donations
exports.getMyDonations = asyncHandler(async (req, res) => {
  const donations = await Donation.find({ donor: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: donations.length,
    donations,
  });
});

// GET /api/energy/buying-limit - Get user's daily buying limit
exports.getBuyingLimit = asyncHandler(async (req, res) => {
  // Only buyers can check their limit
  if (String(req.user.role || '').toLowerCase() !== 'buyer') {
    res.status(403);
    throw new Error('Only Buyers can check buying limits.');
  }

  const limit = await calculateBuyingLimit(req.user);
  
  res.status(200).json({
    success: true,
    limit
  });
});

// Download printable receipt for a donation
exports.getDonationReceiptPdf = asyncHandler(async (req, res) => {
  const { donationId } = req.params;
  const donation = await Donation.findById(donationId).populate('donor', 'name email');
  if (!donation) {
    res.status(404);
    throw new Error('Donation not found');
  }

  const PDFDocument = require('pdfkit');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="powerflow-donation-${donation._id}.pdf"`);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);
  doc.fontSize(18).text('Powerflow - Donation Receipt');
  doc.moveDown().fontSize(12);
  doc.text(`Donation ID: ${donation._id}`);
  doc.text(`Donor: ${donation.donor?.name || donation.donor?.email || donation.donor}`);
  doc.text(`Email: ${donation.donor?.email || ''}`);
  doc.moveDown();
  doc.text(`Beneficiary: ${donation.beneficiary}`);
  doc.text(`Energy Donated: ${donation.kwh} EC`);
  doc.text(`Source: ${donation.source || ''}`);
  doc.text(`Location: ${donation.location || ''}`);
  doc.text(`Date: ${new Date(donation.createdAt).toLocaleString()}`);
  doc.moveDown();
  doc.fontSize(10).text('Thank you for your generous contribution!', { align: 'center' });
  doc.end();
});


