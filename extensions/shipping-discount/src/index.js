// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").InputQuery} InputQuery
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 */

/**
 * @type {FunctionResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

export default /**
 * @param {InputQuery} input
 * @returns {FunctionResult}
 */
(input) => {
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );

  if (!configuration.percentage) {
    return EMPTY_DISCOUNT;
  }

  return {
    discounts: [
      {
        value: {
          percentage: {
            value: configuration.percentage.toString()
          }
        },
        targets: [
          {
            deliveryGroup: {
              id: "gid://shopify/CartDeliveryGroup/0"
            }
          }
        ],
        message: `${configuration.percentage.toString()}% off`
      }
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First
  };
};
