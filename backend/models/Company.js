const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  country: { type: String, required: true },
  currency: { type: String, required: true },
});

module.exports = mongoose.model('Company', companySchema);
