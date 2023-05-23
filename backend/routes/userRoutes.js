const router = require("express").Router();
const User = require("../models/User");
const Order = require("../models/Order");
const makeToken = require("uniqid");
const crypto = require("crypto");
const { sendMail } = require("../ultils/sendmail");
require("dotenv").config();

// signup
// k xac thuc tu dong xoa khoi data sau 16p
setInterval(async () => {
  const now = new Date().getTime();
  await User.deleteMany({
    registrationExpiration: { $lt: now },
  });
}, 16 * 60 * 1000); // Xóa các tài khoản quá hạn mỗi giờ (3600000 ms)
router.post("/signup", async (req, res) => {
  const { email, password, mobile, name } = req.body;
  if (!email || !password || !name || !mobile) {
    return res.status(400).json({
      success: false,
      mes: "Missing inputs",
    });
  }
  if (!email.includes("@") || !email.endsWith(".com")) {
    return res.status(400).json({
      success: false,
      mes: "Invalid email format Ex:abc@gmail.com",
    });
  }
  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(mobile)) {
    return res.status(400).json({
      success: false,
      mes: "Mobile number must have exactly 10 digits",
    });
  }
  if (password.length < 6 || password.length > 12) {
    return res.status(400).json({
      success: false,
      mes: "Password must be between 6 and 12 characters",
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      mes: "User already exists",
    });
  } else {
    const token = makeToken();
    const now = new Date();
    const expiration = now.getTime() + 15 * 60 * 1000;
    await User.create({
      email,
      password,
      mobile,
      name,
      registrationToken: token,
      registrationExpiration: expiration,
    });
    const html = `Xin vui lòng click vào link dưới đây để xác thực tài khoản. Link này sẽ hết hạn sau 15 phút: <a href=${process.env.URL_SERVER}/finalregister/${token}>Click here</a>`;
    await sendMail({ email, html, subject: "Xác Thực Mail" });
    return res.json({
      success: true,
      mes: "Please check your email to activate your account",
    });
  }
});
// xác thực tài khoản
router.get("/finalregister/:token", async (req, res) => {
  const { token } = req.params;
  const now = new Date();

  const user = await User.findOne({
    registrationToken: token,
    registrationExpiration: { $gt: now.getTime() },
  });

  if (!user) {
    return res.redirect(`${process.env.CLIENT_URL}/finalregister/failed`);
  }

  if (user) {
    user.registrationToken = undefined;
    user.registrationExpiration = undefined;
    // await User.deleteMany({
    //   registrationToken: { registrationToken: null },
    // });
    return res.redirect(`${process.env.CLIENT_URL}/finalregister/success`);
  } else {
    return res.redirect(`${process.env.CLIENT_URL}/finalregister/failed`);
  }
});
// login

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByCredentials(email, password);
    res.json(user);
  } catch (e) {
    res.status(400).send(e.message);
  }
});
//forgotpassword
router.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;
  if (!email) throw new Error("Missing email");
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ success: false, mes: "User not found" });
  }
  const resetToken = user.createPasswordChangedToken();
  await user.save();

  const html = `Xin vui long click vao link duoi day de thay doi mat khau.Link nay se het han sau 15p<a href=${process.env.CLIENT_URL}/reset-password/${resetToken} > Clik here</a> `;
  const data = {
    email,
    html,
    subject: "Forgot password",
  };
  const rs = await sendMail(data);
  return res.status(200).json({
    success: rs.response?.includes("OK") ? true : false,
    mes: rs.response?.includes("OK")
      ? "Hãy check mail của bạn "
      : "Mail đã có lỗi hãy thử lại sau ",
  });
});
//resetpassword
router.patch("/resetpassword", async (req, res) => {
  const { token, password } = req.body;
  if (!password || !token) throw new Error("Missing imputs");
  const passwordRestToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    passwordRestToken,
    passwordRestExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error("Invalid reset token");
  user.password = password;
  user.passwordRestToken = undefined;
  user.passwordChangeAt = Date.now();
  user.passwordRestExpires = undefined;
  await user.save();
  return res.status(200).json({
    success: user ? true : false,
    mes: user ? "Update password" : "Something went wrong",
  });
});
// get users;

router.get("/", async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).populate("orders");
    res.json(users);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// get user orders

router.get("/:id/orders", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).populate("orders");
    res.json(user.orders);
  } catch (e) {
    res.status(400).send(e.message);
  }
});
// update user notifcations
router.post("/:id/updateNotifications", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    user.notifications.forEach((notif) => {
      notif.status = "read";
    });
    user.markModified("notifications");
    await user.save();
    res.status(200).send();
  } catch (e) {
    res.status(400).send(e.message);
  }
});

module.exports = router;
