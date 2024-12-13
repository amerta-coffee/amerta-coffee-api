import db from "@/libs/db";
import parseFilters from "@/utils/filter";
import parseSorts from "@/utils/sort";
import handleProductData from "@/helpers/product";

/**
 * Retrieves a list of products that match the given filters and sorts.
 *
 * @param queryFilter An optional filter query string. For example: "name:Kopi Arabika,stockQty:gte:10".
 * @param querySort An optional sort query string. For example: "name:asc,price:desc".
 * @param limit The number of items to return per page. Defaults to 16.
 * @param page The page number to return. If given, the function will return an object with a `pagination` property.
 * @returns A promise that resolves to an array of products or an object with a `products` and a `pagination` property if `page` is given.
 */
export const getAll = async (
  queryFilter?: string,
  querySort?: string,
  limit: number = 16,
  page?: number
) => {
  const where = parseFilters(queryFilter);
  const orderBy = parseSorts(querySort);

  where.isAvailable = true;

  const productsPromise = db.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      priceDiscount: true,
      stockQty: true,
      thumbnailUrl: true,
    },
    where,
    orderBy,
    take: limit,
    skip: page ? (page - 1) * limit : 0,
  });
  const countPromise = page ? db.product.count({ where }) : Promise.resolve(0);

  const [products, totalData] = await Promise.all([
    productsPromise,
    countPromise,
  ]);

  if (page) {
    return {
      products,
      pagination: {
        totalData,
        totalPages: Math.ceil(totalData / limit),
        currentPage: page || 1,
        perPage: limit,
      },
    };
  }

  return products;
};

/**
 * Retrieves a single product by its slug.
 *
 * @param slug The slug of the product to retrieve.
 * @returns A promise that resolves to a product object if found, or null if not found.
 */
export const getBySlug = async (slug: string) => {
  const product = await db.product.findUnique({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      priceDiscount: true,
      stockQty: true,
      category: {
        select: {
          name: true,
        },
      },
      productAssets: {
        select: {
          url: true,
          type: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      user: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
    where: {
      slug,
      NOT: [
        {
          status: "DRAFT",
        },
        {
          status: "ARCHIVED",
        },
      ],
    },
  });

  return product;
};

/**
 * Creates a new product with the given data and associates it with the given user.
 * @param data - The data for the new product.
 * @param userId - The ID of the user who is creating the product.
 * @returns A promise that resolves to the newly created product.
 */
export const create = async (data: any, userId: string) => {
  data = await handleProductData(data);

  const product = await db.product.create({
    data: {
      ...data,
      userId,
      productAssets: {
        create: data.productAssets,
      },
      productDiscounts: {
        create: data.productDiscounts,
      },
    },
    omit: {
      userId: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return product;
};

/**
 * Updates a product by its ID.
 *
 * @param {string} id - The ID of the product to be updated.
 * @param {any} data - The new data for the product.
 * @param {string} userId - The ID of the user who is updating the product.
 * @returns A promise that resolves to the updated product.
 * @throws {Error} If the product is not found.
 */
export const update = async (id: string, data: any, userId: string) => {
  const productExists = await db.product.count({
    where: { id, userId },
  });

  if (!productExists) {
    throw new Error("Product not found");
  }

  data = await handleProductData(data);

  return await db.$transaction(async (tx) => {
    await Promise.all([
      tx.productAsset.deleteMany({ where: { productId: id } }),
      tx.productDiscount.deleteMany({ where: { productId: id } }),
    ]);

    return await tx.product.update({
      where: { id, userId },
      data: {
        ...data,
        userId,
        productAssets: data.productAssets?.length
          ? { create: data.productAssets }
          : undefined,
        productDiscounts: data.productDiscounts?.length
          ? { create: data.productDiscounts }
          : undefined,
      },
      omit: {
        userId: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
};

/**
 * Deletes a product by its ID.
 *
 * @param {string} id - The ID of the product to be deleted.
 * @param {string} userId - The ID of the user who is deleting the product.
 *
 * @returns A promise that resolves to the deleted product.
 *
 * @throws {Error} If the product is not found.
 */
export const deleteById = async (id: string, userId: string) => {
  const product = await db.product.count({
    where: { id, userId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return await db.product.delete({
    where: { id, userId },
  });
};
