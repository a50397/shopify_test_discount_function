## Simple Shopify discount function

A simple discount app that will create `Apply X% discount on every Nth line in an order` discounts. To change this logic, edit extensions/product-discount/src/index.js. 
Modification of discount parameters for existing discounts is not implemented.

Installation:

1. clone this repo
2. cd `shopify_test_discount_function`
3. run `yarn`
4. run `yarn deploy`
    - create a new application when asked
    - name the new application
    - confirm `Yes, deploy to push changes`
5. run `yarn dev`
    - answer `No, connect it to an existing app`
    - select your new app from teh list
    - select `(1) Always by default`
6. open the `Preview URL` displayed by the CLI and install the app
7. create a new discount using new discount type provided by your app
8. test on checkout
