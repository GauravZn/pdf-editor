import express from "express"
import auth from "../middlewares/auth.middleware.js"
import signHash from "../controllers/sign.controller.js"
import showAllSigners from "../controllers/showAllSigners.js"
import saveSign from "../utils/saveSign.js"
import showAllUsers from "../controllers/showAllUsers.js"
import userHistory from "../controllers/userHistory.controller.js"
const router = express.Router()

router.post('/sign', signHash)
router.post('/save-sign',auth, saveSign)
router.get('/all-signers', showAllSigners)
router.get('/all-users', showAllUsers)
router.get('/history',auth, userHistory)

export default router