const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "is required"],
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "is required"],
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    cart: {
      type: Object,
      default: {
        total: 0,
        count: 0,
      },
    },
    refreshToken: {
      type: String,
    },
    passwordChangeAt: {
      type: String,
    },
    passwordRestToken: {
      type: String,
    },
    passwordRestExpires: {
      type: String,
    },
    registerToken: {
      type: String,
    },
    registrationToken: {
      type: String,
      default: null,
    },
    registrationExpiration: {
      type: String,
      default: null,
    },

    notifications: {
      type: Array,
      default: [],
    },

    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { minimize: false }
);

UserSchema.statics.findByCredentials = async function (email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("invalid credentials");
  const isSamePassword = bcrypt.compareSync(password, user.password);
  if (isSamePassword) return user;
  throw new Error("invalid credentials");
};

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

//before saving => hash the password
UserSchema.pre("save", function (next) {
  const user = this;

  if (!user.isModified("password")) return next();

  bcrypt.genSalt(10, function (err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);

      user.password = hash;
      next();
    });
  });
});

UserSchema.pre("remove", function (next) {
  this.model("Order").remove({ owner: this._id }, next);
});

UserSchema.methods.isCorrectPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.createPasswordChangedToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordRestToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordRestExpires = Date.now() + 15 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model("User", UserSchema);

module.exports = User;
