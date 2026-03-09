const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { companyPreparationSchemas } = require("../validation/schemas");
const {
  searchCompanyPreparation,
  getCompanyPreparationHistory,
} = require("../controllers/companyPreparation.controller");

const router = express.Router();

router.post("/search", protect, validate(companyPreparationSchemas.search), searchCompanyPreparation);
router.get("/history", protect, getCompanyPreparationHistory);

module.exports = router;
