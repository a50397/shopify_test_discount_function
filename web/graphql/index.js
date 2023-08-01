const CREATE_AUTOMATIC_MUTATION = `
  mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
    discountCreate: discountAutomaticAppCreate(
      automaticAppDiscount: $discount
    ) {
      userErrors {
        code
        message
        field
      }
    }
  }
`;

const UPDATE_AUTOMATIC_MUTATION = `
  mutation DiscountAutomaticAppUpdate($automaticAppDiscount: DiscountAutomaticAppInput!, $id: ID!) {
    discountAutomaticAppUpdate(automaticAppDiscount: $automaticAppDiscount, id: $id) {
      userErrors {
        code
        field
        message
      }
    }
  }
`;


const CREATE_CODE_MUTATION = `
  mutation CreateCodeDiscount($discount: DiscountCodeAppInput!) {
    discountCreate: discountCodeAppCreate(codeAppDiscount: $discount) {
      userErrors {
        code
        message
        field
      }
    }
  }
`;

const UPDATE_CODE_MUTATION = `
  mutation DiscountCodeAppUpdate($codeAppDiscount: DiscountCodeAppInput!, $id: ID!) {
    discountCodeAppUpdate(codeAppDiscount: $codeAppDiscount, id: $id) {
      userErrors {
        code
        field
        message
      }
    }
  }
`;

const QUERY_FUNCTION_DISCOUNTS = `
  query DiscountNode($id: ID!){
    discountNode(id: $id) {
      discount {
        ...on DiscountAutomaticApp {
          discountId
          title
          discountClass
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
          createdAt
          endsAt
          startsAt
          status
          updatedAt
        }

        ...on DiscountCodeApp {
          discountId
          title
          discountClass
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
          appliesOncePerCustomer
          usageLimit
          createdAt
          endsAt
          startsAt
          status
          updatedAt
        }
      }
      metafields(first: 20) {
        edges {
          node {
            key
            namespace
            value
            id
          }
        }
      }
    }
  }
`;


export {
    CREATE_AUTOMATIC_MUTATION,
    CREATE_CODE_MUTATION,
    UPDATE_AUTOMATIC_MUTATION,
    UPDATE_CODE_MUTATION,
    QUERY_FUNCTION_DISCOUNTS
}
