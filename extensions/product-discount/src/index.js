// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";
/**
* @typedef {import("../generated/api").InputQuery} InputQuery
* @typedef {import("../generated/api").FunctionResult} FunctionResult
* @typedef {import("../generated/api").Target} Target
* @typedef {import("../generated/api").ProductVariant} ProductVariant
*/
/**
* @type {FunctionResult}
*/
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.Maximum,
  discounts: [],
};
export default /**
* @param {InputQuery} input
* @returns {FunctionResult}
*/
  (input) => {
    // Define a type for your configuration, and parse it from the metafield
    /**
    * @type {{
    *  quantity: number
    *  percentage: number
    * }}
    */
    const configuration = JSON.parse(
      input?.discountNode?.metafield?.value ?? "{}"
    );
    if (!configuration.quantity || !configuration.percentage) {
      return EMPTY_DISCOUNT;
    }

    const targets = input.cart.lines.filter(line => line.merchandise.__typename == "ProductVariant")
      // Only include cart lines with a quantity of two or more
      // and a targetable product variant
      .filter((_, index) => (index + 1)%configuration.quantity == 0)
      .map(line => {
        const variant = /** @type {ProductVariant} */ (line.merchandise);
        return /** @type {Target} */ ({
          // Use the variant ID to create a discount target
          productVariant: {
            id: variant.id
          }
        });
      });

    if (!targets.length) {
      // You can use STDERR for debug logs in your function
      console.error("No cart lines qualify for volume discount.");
      return EMPTY_DISCOUNT;
    }

    // The @shopify/shopify_function package applies JSON.stringify() to your function result
    // and writes it to STDOUT
    return {
      discounts: [
        {
          // Apply the discount to the collected targets
          targets,
          // Define a percentage-based discount
          value: {
            percentage: {
              value: configuration.percentage.toString()
            }
          }
        }
      ],
      discountApplicationStrategy: DiscountApplicationStrategy.Maximum
    };
  };
