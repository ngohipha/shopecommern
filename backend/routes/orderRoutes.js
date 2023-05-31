const router = require('express').Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Debt = require('../models/Debt')

//creating an order

router.post('/', async (req, res) => {
  const io = req.app.get('socketio');
  const { userId, cart, country, address } = req.body;
  try {
    const user = await User.findById(userId);

    // Create an order with the provided information
    const order = new Order({ owner: user._id, products: cart, country, address,paymentMethod: req.body.paymentMethod, });
    order.count = cart.count;
    order.total = cart.total;

    // Check if the user isCustomer and the paymentMethod is "Ghi nợ"
    if (user.isCustomer && req.body.paymentMethod === 'Ghi nợ') {
      // Save the order in the `debtOrderModel` model
      const debtOrder = new Debt({
        orderId: order._id,
        orderDate: order.date,
        customerId: user._id,
        product: order.products,
        totalAmount: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentDate: order.paymentDate,
        notes: order.notes
      });
      await debtOrder.save();
    }

    // Save the order in the main `Order` model
    await order.save();

    // Update the user's cart and order list
    user.cart = { total: 0, count: 0 };
    user.orders.unshift(order);
    const notification = { status: 'unread', message: `Đơn hàng mới từ ${user.name}`, time: new Date() };
    io.sockets.emit('new-order', notification);

    await user.save();

    res.status(200).json(user);
  } catch (e) {
    res.status(400).json(e.message);
  }
});


// getting all orders;
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 }).populate('owner', ['email', 'name']);
    res.status(200).json(orders);
  } catch (e) {
    res.status(400).json(e.message);
  }
});


//shipping order

router.patch('/:id/mark-shipped', async (req, res) => {
  const io = req.app.get('socketio');
  const { ownerId } = req.body;
  const { id } = req.params;
  try {
    const user = await User.findById(ownerId);

    // Đánh dấu đơn hàng đã được giao hàng
    await Order.findByIdAndUpdate(id, { status: 'shipped' });

    // Lấy danh sách đơn hàng sau khi đã cập nhật
    const orders = await Order.find().sort({ createdAt: -1 }).populate('owner', ['email', 'name']);

    // Tạo thông báo về việc đơn hàng đã được giao hàng
    const notification = { status: 'unread', message: `Đơn hàng ${id} đã được giao thành công`, time: new Date() };
    io.sockets.emit("notification", notification, ownerId);
    user.notifications.push(notification);
    await user.save();

    res.status(200).json(orders);
  } catch (e) {
    res.status(400).json(e.message);
  }
});
module.exports = router;