## Simple Shopify discount function

A simple discount app that will create `Apply X% discount on every Nth line in an order` discounts. To change this logic, edit [extensions/product-discount/src/index.js](https://github.com/a50397/shopify_test_discount_function/blob/f20c58c5ce223bc6076e9a6b23aa51e95a79a8c6/extensions/product-discount/src/index.js#L20). 
Modification of discount parameters for existing discounts is not implemented.

Installation:

1. make sure you have a dev store [dev store](https://shopify.dev/docs/apps/tools/development-stores#create-a-development-store-to-test-your-app) 
2. clone this repo
3. cd `shopify_test_discount_function`
4. run `yarn` to install the packages
5. run `yarn deploy` to deploy the extension
    - login to login to Shopify Partners if necessary
    - create a new app
    - input a name for the new app
    - confirm `Yes, deploy to push changes`

![image](https://github.com/a50397/shopify_test_discount_function/assets/6513984/7ab56975-a252-4827-a110-b28f7e255b6d)

6. run `yarn dev` to run the app backend 
    - answer `No, connect it to an existing app`
    - select your new app from the list
    - select the dev store from the list (if you have more than one dev store)
    - select `(1) Always by default`
    - open the `Preview URL` displayed by the CLI and install the app

![image](https://github.com/a50397/shopify_test_discount_function/assets/6513984/04ee3397-c45a-4ad7-899f-32da6be306c7)

7. create a new discount using new discount type provided by your app

![image](https://github.com/a50397/shopify_test_discount_function/assets/6513984/207795d7-9ba7-4364-aaac-ad8865d7540f)
   
8. add products to the cart and test the discount at checkout
9. check app logs `Shopify Partners` -> `Stores` -> select store -> select app -> `Extensions` -> select extension -> scroll down -> `See details`

![image](https://github.com/a50397/shopify_test_discount_function/assets/6513984/4d2e96ed-0b04-4073-9e39-4b1e5a0ddbfa)


