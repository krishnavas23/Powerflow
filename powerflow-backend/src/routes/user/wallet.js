const express = require('express')
const router = express.Router()
const {
    topUpWallet,
    getBalance,
    getTransactions,
    withdrawFunds,
    redeemCredits,
} = require('../../controllers/user/walletController')
const auth = require('../../middleware/auth')

router.get('/balance', auth, getBalance);
router.get('/transactions', auth, getTransactions);
router.post('/top-up', auth, topUpWallet);
router.post('/withdraw', auth, withdrawFunds);
router.post('/redeem', auth, redeemCredits);

module.exports = router
