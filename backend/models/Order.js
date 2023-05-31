const mongoose = require("mongoose");
const OrderSchema = mongoose.Schema(
  {
    products: {
      type: Object,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    debtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Debt",
      required: function () {
        return this.user && this.user.isCustomer;
      },
    },
    status: {
      type: String,
      default: "processing",
    },
    total: {
      type: Number,
      default: 0,
    },
    count: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    address: {
      type: String,
    },
    country: {
      type: String,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
  },
  { minimize: false }
);
const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
