const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const DebtOrder = require("../models/Debt");

//get all debtorder

router.get("/", async (req, res) => {
  try {
    const debtOrders = await DebtOrder.find()
    .populate("customerId", "name") // Populate the 'customerId' field and only retrieve the 'name' field from the referenced User collection
    .sort("customerId.name"); // Sort the results based on the 'name' field of the referenced User
  
    res.json(debtOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Đã xảy ra lỗi server" });
  }
});

// thanh toán 
router.post("/debtOrders/:id/pay", async(req,res)=>{
  const {id} = req.params;
  const { user_id } = req.body;
  try {
    const user = await User.findById(user_id);
    if (!user.isAdmin === false) return res.status(401).json("You don't have permission");
    // update the payment status and payment date of the order
    const updatedOrder = await DebtOrder.findByIdAndUpdate( id, { 
      paymentStatus : "Đã Thanh Toán",
      paymentDate: new Date()
    },{new : true});
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
  
    res.json(updatedOrder);
  }catch(error){
    res.status(500).json({ error: "Internal server error" })
  }

});

// delete request to remove an order from the database
router.delete("/debtOrders/:id",async(req,res)=>{
  const {id} = req.params;
  const { user_id } = req.body;

  try {
    const user = await User.findById(user_id);
    if (!user.isAdmin === false) return res.status(401).json("You don't have permission");
    const deleteOrder = await DebtOrder.findOneAndDelete(id);
    if(!deleteOrder){
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(deleteOrder)
  } catch (error) {
    res.status(500).json({error: "Internal server error"})
  }
})
module.exports = router;