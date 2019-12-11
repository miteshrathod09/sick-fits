const { randomBytes } = require("crypto");
const { promisify } = require("util");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { transport, emailTemplate } = require("../mail");
const { hasPermission } = require("../utils");
const stripe = require("../stripe");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in to create an item!");
    }

    // create relationshop between user and id!
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
          ...args
        }
      },
      info
    );
    return item;
  },

  updateItem(parent, args, ctx, info) {
    const userId = ctx.request.userId;
    if (!userId) {
      throw new Error("Not Logged in!");
    }
    const updates = { ...args };
    delete updates.id;
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    const item = await ctx.db.query.item(
      {
        where
      },
      `{id title user {id}}`
    );

    const ownsItem = (item.user.id = ctx.request.userId);

    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ["ADMIN", "ITEMDELETE"].includes(permission)
    );

    if (!ownsItem && !hasPermissions) {
      throw new Error("You cannot delete!");
    }

    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    const password = await bcrypt.hash(args.password, 10);
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: {
            set: ["USER"]
          }
        }
      },
      info
    );
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // check if user exists
    const user = await ctx.db.query.user({
      where: { email }
    });
    if (!user) {
      throw new Error("No such user found");
    }
    // check is password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid password");
    }
    // gen JWT
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // set cookie with token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // return the user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Goodbye!" };
  },
  async requestReset(parent, args, ctx, info) {
    const user = await ctx.db.query.user({
      where: { email: args.email }
    });
    if (!user) {
      throw new Error("No such user found");
    }
    const randomBytesPromise = promisify(randomBytes);
    const resetToken = (await randomBytesPromise(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000;
    await ctx.db.mutation.updateUser({
      where: {
        email: args.email
      },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    const emailResponse = await transport.sendMail({
      from: "jainmitesh09@gmail.com",
      to: user.email,
      subject: "Password Reset Token",
      html: emailTemplate(`
      Your password reset token is 
      \n\n ${resetToken} \n\n
      <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click here to reset</a>`)
    });

    return {
      message: "Success"
    };
  },
  async resetPassword(parent, args, ctx, info) {
    if (args.password !== args.confirmPassword) {
      throw new Error("Passwords dont match");
    }
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });
    if (!user) {
      throw new Error("Invalid token");
    }
    const password = await bcrypt.hash(args.password, 10);
    const updatedUser = await ctx.db.mutation.updateUser({
      where: {
        email: user.email
      },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    const newJWTToken = jwt.sign(
      { userId: updatedUser.id },
      process.env.APP_SECRET
    );
    ctx.response.cookie("token", newJWTToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // check if logged in

    if (!ctx.request.userId) {
      throw new Error("Not Logged in!");
    }

    // query user

    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId
        }
      },
      info
    );

    // check if they have perm

    hasPermission(currentUser, ["ADMIN", "PERMISSIONUPDATE"]);

    // update

    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions // because of permission is enum
          }
        },
        where: {
          id: args.userId
        }
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // make
    const userId = ctx.request.userId;
    if (!userId) {
      throw new Error("Not Logged in!");
    }
    // query the user's current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: {
          id: userId
        },
        item: {
          id: args.id
        }
      }
    });
    // check if that item is already in the cart inc by one
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem(
        {
          where: {
            id: existingCartItem.id
          },
          data: {
            quantity: existingCartItem.quantity + 1
          }
        },
        info
      );
    }
    // if not creat fresh item cart

    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: {
              id: userId
            }
          },
          item: {
            connect: {
              id: args.id
            }
          }
        }
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    // find cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id
        }
      },
      `{id, user{id}}`
    );

    if (!cartItem) {
      return new Error("No cart item found!");
    }

    // make sure they own this cart item

    if (cartItem.user.id !== ctx.request.userId) {
      return new Error("User does not own this cart item");
    }

    // delete this cart item

    return ctx.db.mutation.deleteCartItem(
      {
        where: {
          id: args.id
        }
      },
      info
    );
  },

  async createOrder(parent, args, ctx, info) {
    // query current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw Error("You must be signed in!");
    }

    const user = await ctx.db.query.user(
      {
        where: {
          id: userId
        }
      },
      `{
        id 
        name
        email
        cart { 
          id 
          quantity 
          item {
            id
            title
            price
            description
            image
            largeImage
          }
        }
      }`
    );
    // re calc total for price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );

    // create stripe charge

    const charge = await stripe.charges.create({
      amount,
      currency: "USD",
      source: args.token
    });
    // convert cart items to order itmes

    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: {
          connect: {
            id: userId
          }
        }
      };
      delete orderItem.id;
      return orderItem;
    });

    // create order

    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: {
          create: orderItems
        },
        user: {
          connect: {
            id: userId
          }
        }
      }
    });

    // clear users cart
    // delete cartItems

    const cartItemIds = user.cart.map(cartItem => cartItem.id);

    await ctx.db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds
      }
    });

    // return order

    return order;
  }
};

module.exports = Mutations;
