import { Prisma } from "@prisma/client";
import db from "@/libs/db";
import slugify from "./slugify";

enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

type Discount = {
  type: DiscountType;
  value: number;
  startDate: string;
  endDate: string;
};

/**
 * Calculate the discount for a product based on the given discounts.
 * @param {number} price - The price of the product.
 * @param {Discount[]} discounts - The discounts to be applied.
 * @returns {Prisma.Decimal | null} - The discount value, or null if no discount is applicable.
 */
function calculateDiscount(
  price: number,
  discounts: Discount[]
): Prisma.Decimal | null {
  const now = new Date();

  const applicableDiscount = discounts.find((discount) => {
    const startDate = new Date(discount.startDate);
    const endDate = new Date(discount.endDate);
    return now >= startDate && now <= endDate;
  });

  if (applicableDiscount) {
    const discountValue = parseFloat(applicableDiscount.value.toString());

    if (applicableDiscount.type.toLowerCase() === "percentage") {
      return new Prisma.Decimal((discountValue * price) / 100);
    } else if (applicableDiscount.type.toLowerCase() === "fixed") {
      return new Prisma.Decimal(discountValue);
    }
  }

  return null;
}

/**
 * Generates a unique slug for a product based on the given name.
 *
 * @param {string} name - The name of the product.
 * @param {string} [slug] - The slug to be used as the base for the generated slug.
 * @returns {Promise<string>} - The generated slug.
 *
 * If the generated slug is not unique, it appends a number to the slug to make it unique.
 * For example, if the generated slug is "example-product", and it already exists, it will
 * generate "example-product-2", or "example-product-3", and so on.
 */
async function generateSlug(name: string, slug?: string): Promise<string> {
  const baseSlug = slug ? slugify(slug) : slugify(name);

  const similarSlugs = await db.product.findMany({
    where: {
      slug: {
        startsWith: baseSlug,
      },
    },
    select: { slug: true },
  });

  const existingSlugs = new Set(similarSlugs.map((product) => product.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let count = 1;
  let uniqueSlug = baseSlug;
  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${count}`;
    count += 1;
  }

  return uniqueSlug;
}

/**
 * Ensures that a category with the given name exists in the database.
 *
 * If the category does not exist, it creates a new one. If the category already
 * exists, it does nothing and returns the ID of the existing category.
 *
 * @param {string} name - The name of the category.
 * @returns {Promise<string | null>} - The ID of the category if it exists,
 *   or null if the category name is empty or null.
 */
async function ensureCategory(name: string): Promise<string | null> {
  if (!name) return null;

  const category = await db.category.upsert({
    where: { name },
    update: {},
    create: { name },
    select: { id: true },
  });

  return category.id;
}

/**
 * Processes product data by handling category and slug.
 *
 * Ensures that a category with the given name exists in the database, and
 * generates a unique slug based on the product name.
 *
 * @param data - The product data to be processed, which includes category and slug.
 * @returns A promise that resolves to the processed product data with updated
 *          categoryId and slug.
 */
async function handleCategoryAndSlug(data: any): Promise<any> {
  const categoryId = data.category ? await ensureCategory(data.category) : null;
  const slug = await generateSlug(data.name, data.slug);

  data.categoryId = categoryId;
  data.slug = slug;
  delete data.category;

  return data;
}

/**
 * Handles product assets and discounts.
 *
 * It sets the thumbnailUrl property of the product to the URL of the first
 * image asset in the productAssets array, and sets the priceDiscount property
 * to the calculated discount value based on the product's price and the discounts
 * in the productDiscounts array.
 *
 * @param {Object} data - The product data to be processed.
 * @returns {Object} - The processed product data with updated thumbnailUrl and priceDiscount.
 */
function handleAssetsAndDiscounts(data: any): any {
  if (data.productAssets && data.productAssets.length >= 1) {
    data.thumbnailUrl = data.productAssets.find(
      (asset: any) => asset.order === 0 && asset.type === "IMAGE"
    )?.url;
  }

  if (data.productDiscounts && data.productDiscounts.length >= 1) {
    data.priceDiscount = calculateDiscount(data.price, data.productDiscounts);
  }

  return data;
}

/**
 * Processes product data by handling category, slug, assets, and discounts.
 *
 * @param data - The product data to be processed, which includes category, slug,
 *               product assets, and product discounts.
 * @returns A promise that resolves to the processed product data with updated
 *          categoryId, slug, thumbnailUrl, and priceDiscount.
 */
export default async function handleProductData(data: any): Promise<any> {
  data = await handleCategoryAndSlug(data);
  data = handleAssetsAndDiscounts(data);
  return data;
}
