const router = require('express').Router();
const Order = require('../models/Order');
const User = require('../models/User');


//creating an order

router.post('/', async (req, res) => {
  const io = req.app.get('socketio');
  const { userId, cart, country, address } = req.body;
  try {
    const user = await User.findById(userId);

    // Tạo đơn hàng với các thông tin được cung cấp
    const order = new Order({ owner: user._id, products: cart, country, address });
    order.count = cart.count;
    order.total = cart.total;
    await order.save();

    // Cập nhật giỏ hàng của người dùng và danh sách đơn hàng
    user.cart = { total: 0, count: 0 };
    user.orders.unshift(order); // Đẩy đơn hàng mới vào đầu danh sách
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
    const orders = await Order.find().sort({ createdAt: -1 }).populate('owner', ['email', 'name']);
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