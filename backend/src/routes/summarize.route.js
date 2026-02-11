import express from "express"
import summarizeController from "../controllers/summarize.controller.js"

const router = express.Router()


router.get('/:hash', summarizeController)

export default router