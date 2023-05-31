const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const debtOrderSchema = new Schema({
  orderId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  orderDate: { type: Date, require: true },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  product: { type: Object },
  totalAmount: { type: Number, require: true },
  paymentMethod: { type: String },
  paymentStatus: {
    type: String,
    default: "Ghi nợ",
  },
  paymentDate: { type: Date },
  notes: { type: String },
});
const DebtOrder = mongoose.model("DebtOrder", debtOrderSchema);
module.exports = DebtOrder;
