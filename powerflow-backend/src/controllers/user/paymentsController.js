const PDFDocument = require('pdfkit');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Fetch a transaction by Stripe session id (stored as externalRefId)
exports.getTransactionBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    let tx = await Transaction.findOne({ externalRefId: sessionId }).lean();
    if (!tx) {
      // Fallback: fetch details from Stripe session so UI can render even if webhook is delayed
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        tx = {
          type: 'RECHARGE',
          totalAmount: (session.amount_total || 0) / 100,
          status: session.payment_status === 'paid' ? 'COMPLETED' : 'PENDING',
          externalRefId: sessionId,
          createdAt: new Date().toISOString(),
        };
      } catch (_) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
    }
    res.json(tx);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load transaction' });
  }
};

// Stream a simple PDF receipt by session id
exports.getReceiptPdfBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    let tx = await Transaction.findOne({ externalRefId: sessionId }).lean();
    if (!tx) {
      // Fallback to Stripe for minimal data
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        tx = {
          type: 'RECHARGE',
          totalAmount: (session.amount_total || 0) / 100,
          status: session.payment_status === 'paid' ? 'COMPLETED' : 'PENDING',
          externalRefId: sessionId,
          createdAt: new Date().toISOString(),
        };
      } catch (_) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
    }

    const userId = (tx.buyer && tx.buyer.toString()) || null;
    const user = userId ? await User.findById(userId).lean() : null;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="powerflow-receipt-${sessionId}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .text('POWERFLOW', { align: 'left' })
      .moveDown(0.3)
      .fontSize(10)
      .text('support@powerflow.io')
      .moveDown(1);

    doc
      .fontSize(16)
      .text('Payment Receipt', { align: 'left' })
      .moveDown(0.5);

    // Details
    const created = tx.createdAt ? new Date(tx.createdAt) : new Date();
    doc.fontSize(12);
    doc.text(`Receipt #: ${tx._id}`);
    doc.text(`Stripe Session: ${sessionId}`);
    doc.text(`Date: ${created.toLocaleString()}`);
    if (user) {
      doc.text(`Customer: ${user.name || user.email || user._id}`);
      doc.text(`Email: ${user.email || ''}`);
    }
    doc.moveDown(1);

    doc.text('Description: Wallet Recharge', { continued: true }).text('  (RECHARGE)');
    doc.moveDown(0.5);
    doc.text(`Amount Paid: ₹${Number(tx.totalAmount || 0).toFixed(2)}`);
    doc.text(`Status: ${tx.status}`);

    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for using Powerflow.', { align: 'center' });

    doc.end();
  } catch (e) {
    res.status(500).json({ message: 'Failed to generate receipt PDF' });
  }
};

// Stream PDF receipt for a trade by transaction id
exports.getTradeReceiptPdf = async (req, res) => {
  try {
    const { txId } = req.params;
    const tx = await Transaction.findById(txId).lean();
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    const buyer = tx.buyer ? await User.findById(tx.buyer).lean() : null;
    const seller = tx.seller ? await User.findById(tx.seller).lean() : null;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="powerflow-trade-${tx._id}.pdf"`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);
    doc.fontSize(18).text('Powerflow Trade Receipt');
    doc.moveDown().fontSize(12);
    doc.text(`Transaction: ${tx._id}`);
    doc.text(`Type: ${tx.type}`);
    doc.text(`Quantity: ${tx.kwh} kWh`);
    doc.text(`Total Paid: ₹${Number(tx.totalAmount || 0).toFixed(2)}`);
    doc.text(`Date: ${new Date(tx.createdAt || Date.now()).toLocaleString()}`);
    doc.moveDown();
    doc.text(`Buyer: ${buyer?.name || buyer?.email || buyer?._id || ''}`);
    doc.text(`Seller: ${seller?.name || seller?.email || seller?._id || ''}`);
    doc.end();
  } catch (e) {
    res.status(500).json({ message: 'Failed to generate trade receipt PDF' });
  }
};


