const router = require("express").Router();
const User = require("../models/User");
const Order = require("../models/Order");
const makeToken = require("uniqid");
const crypto = require("crypto");
const { sendMail } = require("../ultils/sendmail");
require("dotenv").config();
const emailValidator = require("email-validator");
const passwordValidator = require("password-validator");

// signup
const schema = new passwordValidator();
schema.is().min(6).is().max(12);
router.post("/signup", async (req, res) => {
  const { email, password, mobile, name } = req.body;
  if (!email || !password || !name || !mobile) {
    return res.status(400).json({
      success: false,
      mes: "Missing inputs",
    });
  }
  // Validate email
  if (!emailValidator.validate(email)) {
    return res.status(400).json({
      success: false,
      mes: "Invalid email",
    });
  }

  // Validate password
  if (!schema.validate(password)) {
    return res.status(400).json({
      success: false,
      mes: "Invalid password",
    });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        mes: "User already exists",
      });
    } else {
      const token = makeToken();
      // Store the user with isAccept: false in the database
      const user = await User.create({
        email,
        password,
        mobile,
        name,
        isAccept: false,
        registerToken: token,
      });

      const html = `Xin vui lòng click vào link dưới đây để xác thực tài khoản. Link này sẽ hết hạn sau 15 phút: <a href="${process.env.URL_SERVER}/users/finalregister/${token}">Click here</a>`;
      await sendMail({ email, html, subject: "Xác Thực Mail" });

      // Schedule a timeout to check if the user has verified within 15 minutes
      setTimeout(async () => {
        const updatedUser = await User.findOne({ registerToken: token });
        if (updatedUser && !updatedUser.isAccept) {
          // User hasn't verified within 15 minutes, delete the record
          await User.deleteOne({ registerToken: token });
        }
      }, 15 * 60 * 1000); // 15 minutes in milliseconds

      res.status(200).json({
        success: true,
        mes: "Signup successful. Please check your email to verify your account.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal Server Error");
  }
});
router.get("/finalregister/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOneAndUpdate(
      { registerToken: token },
      { isAccept: true },
      { new: true }
    );

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/finalregister/failed`);
    }

    return res.redirect(`${process.env.CLIENT_URL}/finalregister/success`);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Internal Server Error");
  }
});
// login

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByCredentials(email, password);
    if (user.isAccept) {
      // Trạng thái xác thực là true, cho phép người dùng đăng nhập
      res.json(user);
    } else {
      // Trạng thái xác thực là false, hiển thị thông báo lỗi hoặc yêu cầu người dùng hoàn tất quá trình xác thực qua email.
      res.status(401).json({ error: 'Tài khoản chưa được xác thực qua email.' });
    }
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
