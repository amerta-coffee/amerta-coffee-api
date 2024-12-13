import db from "@/libs/db";
import * as cartHelper from "@/helpers/cart";

/**
 * Retrieves or creates the user's cart and returns its details.
 *
 * This function performs an upsert operation on the cart, ensuring that a cart
 * exists for the given user. If the cart does not exist, it creates a new cart
 * with no items. It returns the cart details including the items and their
 * associated products, sorted by product name. Additionally, it calculates the
 * total price of the items in the cart.
 *
 * @param {string} userId - The ID of the user whose cart is being retrieved.
 * @returns {Promise<{ cart: object, total: number }>} - An object containing
 * the cart details and the total price of the items in the cart.
 * @throws {Error} If any product price is invalid.
 */
export const getCart = async (
  userId: string
): Promise<{ cart: object; total: number }> => {
  const result = await db.$transaction(async (prisma) => {
    return await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId, cartItems: { create: [] } },
      select: {
        cartItems: {
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                thumbnailUrl: true,
                price: true,
                priceDiscount: true,
              },
            },
          },
          orderBy: {
            product: { name: "asc" },
          },
        },
      },
    });
  });

  const total = result?.cartItems.reduce((acc, item) => {
    const price = Number(item.product.price);
    if (isNaN(price)) throw new Error("Invalid product price");
    return acc + item.quantity * price;
  }, 0);

  return { cart: result?.cartItems, total };
};

/**
 * Add or update a cart item.
 *
 * If the cart item is not found, it will be created. If the cart item is found, its quantity will be updated.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The ID of the product.
 * @param {number} quantity - The quantity of the product. Defaults to 1.
 * @param {boolean} isIncrement - Whether to increment the quantity or set it. Defaults to true.
 * @returns A promise that resolves to an object with a message and the updated cart item.
 * @throws {object} If the product is not found or the quantity is invalid.
 */
export const addOrUpdateCartItem = async (
  userId: string,
  productId: string,
  quantity: number = 1,
  isIncrement: boolean = true
) => {
  return await db.$transaction(async (prisma) => {
    const [cart, product, cartItem] = await Promise.all([
      prisma.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      }),
      prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, stockQty: true },
      }),
      prisma.cartItem.findFirst({
        where: {
          cart: { userId },
          productId,
        },
        select: { quantity: true },
      }),
    ]);

    if (!product) {
      throw {
        code: 404,
        error: "PRODUCT_NOT_FOUND",
        message: "Product not found",
      };
    }

    const availableStock = product.stockQty;
    const newQuantity = isIncrement
      ? (cartItem?.quantity || 0) + quantity
      : quantity;

    if (newQuantity > availableStock) {
      throw {
        code: 400,
        error: "INVALID_QUANTITY",
        message: `Product ${product.name} has only ${availableStock} available stock!`,
      };
    }

    if (!isIncrement && newQuantity === 0) {
      if (!cartItem) {
        throw {
          code: 404,
          error: "CART_ITEM_NOT_FOUND",
          message: "Cart item not found!",
        };
      }

      await prisma.cartItem.delete({
        where: {
          productId_cartId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      return {
        message: `Successfully removed product ${product.name} from cart!`,
      };
    }

    const updatedCartItem = await prisma.cartItem.upsert({
      where: {
        productId_cartId: {
          cartId: cart.id,
          productId,
        },
      },
      update: {
        quantity: isIncrement ? { increment: quantity } : { set: newQuantity },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
      select: {
        quantity: true,
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            thumbnailUrl: true,
            price: true,
            priceDiscount: true,
          },
        },
      },
    });

    return {
      message: cartItem
        ? "Successfully updated cart item!"
        : "Successfully added product to cart!",
      data: updatedCartItem,
    };
  });
};

/**
 * Deletes a cart item by its product ID.
 *
 * @param {string} userId - The ID of the user whose cart is being modified.
 * @param {string} productId - The ID of the product to delete from the cart.
 * @returns {Promise<object>} - A promise that resolves to the deleted cart item.
 * @throws {Error} If the cart item is not found.
 */
export const deleteCartItem = async (
  userId: string,
  productId: string
): Promise<object> => {
  const cartItem = await db.cartItem.findFirst({
    where: {
      productId,
      cart: {
        userId,
      },
    },
    select: {
      id: true,
      cartId: true,
    },
  });

  if (!cartItem) {
    throw new Error("Cart item not found.");
  }

  return await db.cartItem.delete({
    where: {
      id: cartItem.id,
    },
  });
};

/**
 * Checkout the user's cart and create an order.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} shippingAddressId - The ID of the shipping address.
 * @returns  A promise that resolves to an object with the created order and transaction.
 * @throws {Error} If the cart is empty or the shipping address is not found.
 */
export const checkout = async (userId: string, shippingAddressId: string) => {
  return await db.$transaction(async (prisma) => {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { cartItems: { include: { product: true } } },
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    const shippingAddress = await prisma.userAddress.count({
      where: { id: shippingAddressId },
    });

    if (shippingAddress === 0) {
      throw new Error("Shipping address not found");
    }

    const productIds = cart.cartItems.map((item) => item.productId);
    const [products, cartItems] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, stockQty: true, price: true, name: true },
      }),
      prisma.cartItem.findMany({
        where: { cartId: cart.id },
        select: { productId: true, quantity: true },
      }),
    ]);

    const productStock = products.reduce((acc, product) => {
      acc[product.id] = product.stockQty;
      return acc;
    }, {} as { [key: string]: number });

    cartHelper.validateProductStock(cartItems, productStock);

    const totalPrice = cartHelper.calculateTotalPrice(cart.cartItems, products);

    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice,
        status: "pending",
        shippingAddressId,
        orderItems: {
          create: cart.cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        orderItems: {
          select: {
            quantity: true,
            product: { select: { name: true, price: true } },
          },
        },
      },
    });

    const decrementStock = cart.cartItems.reduce((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
      return acc;
    }, {} as { [productId: string]: number });

    const stockUpdates = Object.entries(decrementStock).map(
      ([productId, quantity]) =>
        prisma.product.update({
          where: { id: productId },
          data: { stockQty: { decrement: quantity } },
        })
    );

    const invoiceNumber = cartHelper.generateInvoiceNumber();

    const [transaction] = await Promise.all([
      prisma.transaction.create({
        data: {
          noInvoice: invoiceNumber,
          amount: Number(order.totalPrice),
          status: "Pending",
          orderId: order.id,
        },
      }),
      ...stockUpdates,
    ]);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { order, transaction };
  });
};
