import { format } from "date-fns";
import { nanoid } from "nanoid";

/**
 * Generates a unique invoice number in the format of INV-YYYYMMDD-XXXXXX.
 * The YYYYMMDD part is the current date in the format of year, month and day.
 * The XXXXXX part is a randomly generated 6-character string.
 * @returns {string} Unique invoice number.
 */
export const generateInvoiceNumber = (): string => {
  const today = new Date();
  const formattedDate = format(today, "yyyyMMdd");
  const uniqueId = nanoid(6);
  return `INV-${formattedDate}-${uniqueId}`;
};

/**
 * Validates if the cart items have sufficient stock available.
 *
 * This function checks the stock quantity for each product in the cart against the available stock.
 * If any product does not have sufficient stock, it throws an error with the product IDs that are
 * insufficient.
 *
 * @param {Array<{ productId: string; quantity: number }>} cartItems - The items in the cart with their quantities.
 * @param {{ [key: string]: number }} productStock - An object mapping product IDs to their available stock.
 * @throws Will throw an error if any product has insufficient stock.
 */
export const validateProductStock = (
  cartItems: { productId: string; quantity: number }[],
  productStock: { [key: string]: number }
) => {
  const insufficientStockProducts = cartItems.filter(
    (item) => productStock[item.productId] < item.quantity
  );
  if (insufficientStockProducts.length > 0) {
    const productNames = insufficientStockProducts
      .map((item) => item.productId)
      .join(", ");
    throw new Error(`Insufficient stock for product(s): ${productNames}`);
  }
};

/**
 * Calculates the total price of the cart items.
 *
 * @param {Array<{ productId: string; quantity: number }>} cartItems - The items in the cart with their quantities.
 * @param {Array<{ id: string; price: any }>} products - The array of products with prices.
 * @returns {number} The total price of the cart items.
 */
export const calculateTotalPrice = (
  cartItems: { productId: string; quantity: number }[],
  products: { id: string; price: any }[]
): number => {
  return cartItems.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    return acc + item.quantity * Number(product?.price || 0);
  }, 0);
};
