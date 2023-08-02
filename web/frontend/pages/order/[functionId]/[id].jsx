import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { useForm, useField } from "@shopify/react-form";
import { CurrencyCode } from "@shopify/react-i18n";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
    ActiveDatesCard,
    CombinationCard,
    DiscountClass,
    DiscountMethod,
    MethodCard,
    DiscountStatus,
    RequirementType,
    SummaryCard,
    UsageLimitsCard,
    onBreadcrumbAction,
} from "@shopify/discount-app-components";
import {
    Banner,
    Card,
    Layout,
    Page,
    TextField,
    Stack,
    PageActions,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "../../../hooks";
const todaysDate = new Date();
// Metafield that will be used for storing function configuration
const METAFIELD_NAMESPACE = "$app:product-discount";
const METAFIELD_CONFIGURATION_KEY = "function-configuration";

export default function ProductDetailsFetcher() {
    const { functionId, id } = useParams();
    const [discount, setDiscount] = useState(null);
    const authenticatedFetch = useAuthenticatedFetch();

    useEffect(() => {
        const fetchDiscountDetails = async() => {
            return authenticatedFetch(`/api/discounts/details/${id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
            });
        }

        fetchDiscountDetails()
        .then(response =>
            response.json()
        )
        .then(data => {
            if (!data) return setDiscount("Error loading discount");
            let metafields = {
                percentage: 10,
            }
            if (data.metafields?.edges.length > 0) {
                try {
                    metafields = JSON.parse(data.metafields.edges[0].node.value);
                } catch (e) {
                    console.error(data, e);
                }
            }
            data.metafields = {
                value: metafields,
                id: data.metafields?.edges[0]?.node?.id,
            };
            if (data?.discount?.startsAt){
                try {
                    data.discount.startsAt = new Date(data.discount.startsAt);
                } catch (e) {
                    console.error(e);
                }
            }

            if (data?.discount?.endsAt){
                try {
                    data.discount.endsAt = new Date(data.discount.endsAt);
                } catch (e) {
                    console.error(e);
                }
            }

            setDiscount(data);
        })
        .catch(console.error);
    }, []);

    if (!discount) {
        return <div>Loading discount id {id}...</div>;
    } else if (discount === "Error loading discount") {
        return <div>Error loading discount id {id}</div>;
    }

    return <ProductDetails functionId={functionId} discount={discount} />;
}

export function ProductDetails({functionId, discount}) {
    console.log('DISCOUNT', discount)
    // Read the function ID from the URL

    const app = useAppBridge();
    const redirect = Redirect.create(app);
    const currencyCode = CurrencyCode.Cad;
    const authenticatedFetch = useAuthenticatedFetch();

    const isCodeDiscount = () => discount?.discount?.discountId.includes('Code')

    // Define base discount form fields
    const {
        fields: {
            discountTitle,
            discountCode,
            discountMethod,
            combinesWith,
            requirementType,
            requirementSubtotal,
            requirementQuantity,
            usageTotalLimit,
            usageOncePerCustomer,
            startDate,
            endDate,
            configuration,
        },
        submit,
        submitting,
        dirty,
        reset,
        submitErrors,
        makeClean,
    } = useForm({
        fields: {
            discountTitle: useField(discount?.discount?.title || ''),
            discountMethod: useField(
                isCodeDiscount() ? DiscountMethod.Code : DiscountMethod.Automatic
            ),
            discountCode: useField(discount?.discount?.title || ''),
            combinesWith: useField({
                orderDiscounts: discount?.discount?.combinesWith?.orderDiscounts || false,
                productDiscounts: discount?.discount?.combinesWith?.productDiscounts || false,
                shippingDiscounts: discount?.discount?.combinesWith?.shippingDiscounts || false,
            }),
            requirementType: useField(RequirementType.None),
            requirementSubtotal: useField("0"),
            requirementQuantity: useField("0"),
            usageTotalLimit: useField(discount?.discount?.usageLimit || null),
            usageOncePerCustomer: useField(discount?.discount?.appliesOncePerCustomer || false),
            startDate: useField(discount?.discount?.startsAt || todaysDate),
            endDate: useField(discount?.discount?.endsAt || null),
            configuration: {
                percentage: useField(discount.metafields.value.percentage || '10'),
            },
        },
        onSubmit: async (form) => {
            // Create the discount using the added express endpoints
            const input = {
                functionId,
                combinesWith: form.combinesWith,
                startsAt: form.startDate,
                endsAt: form.endDate,
                metafields: [
                    {
                        id: discount.metafields.id,
                        value: JSON.stringify({
                            percentage: parseFloat(form.configuration.percentage),
                        }),
                    },
                ],
            };

            let response;
            if (form.discountMethod === DiscountMethod.Automatic) {
                response = await authenticatedFetch(`/api/discounts/automatic/${discount?.discount?.discountId.replace('gid://','')}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        automaticAppDiscount: {
                          ...input,
                          title: form.discountTitle,
                        },
                      }),
                });
            } else {
                input.appliesOncePerCustomer = form.usageOncePerCustomer;
                input.usageLimit = form.usageTotalLimit ? Number.parseInt(form.usageTotalLimit) : null;
                response = await authenticatedFetch(`/api/discounts/code/${discount?.discount?.discountId.replace('gid://','')}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        codeAppDiscount: {
                          ...input,
                          title: form.discountCode,
                          code: form.discountCode,
                        },
                      }),
                });
            }

            const data = (await response.json()).data;
            const remoteErrors = isCodeDiscount() ?
                data.discountCodeAppUpdate.userErrors :
                data.discountAutomaticAppUpdate.userErrors;
            if (remoteErrors.length > 0) {
                return { status: "fail", errors: remoteErrors };
            }

            redirect.dispatch(Redirect.Action.ADMIN_SECTION, {
                name: Redirect.ResourceType.Discount,
            });

            return { status: "success" };
        },
    });

    const errorBanner =
        submitErrors.length > 0 ? (
            <Layout.Section>
                <Banner status="critical">
                    <p>There were some issues with your form submission:</p>
                    <ul>
                        {submitErrors.map(({ message, field }, index) => {
                            return (
                                <li key={`${message}${index}`}>
                                    {field.join(".")} {message}
                                </li>
                            );
                        })}
                    </ul>
                </Banner>
            </Layout.Section>
        ) : null;

        return (
            // Render a discount form using Polaris components and the discount app components
            <Page
                title="Edit order discount"
                breadcrumbs={[
                    {
                        content: "Discount",
                        onAction: () => onBreadcrumbAction(redirect, true),
                    },
                ]}
                primaryAction={{
                    content: "Save",
                    onAction: submit,
                    disabled: !dirty,
                    loading: submitting,
                }}
            >
                <Layout>
                    {errorBanner}
                    <Layout.Section>
                        <form onSubmit={submit}>
                            <MethodCard
                                discountMethodHidden={true}
                                readonly={true}
                                title="Order"
                                discountTitle={discountTitle}
                                discountClass={DiscountClass.Order}
                                discountCode={discountCode}
                                discountMethod={discountMethod}
                            />
                            { /* Collect data for the configuration metafield. */ }
                            <Card title="Order">
                                <Card.Section>
                                    <Stack>
                                    <TextField label="Discount percentage" {...configuration.percentage} suffix="%" />
                                    </Stack>
                                </Card.Section>
                            </Card>
                            {discountMethod.value === DiscountMethod.Code && (
                                <UsageLimitsCard
                                    totalUsageLimit={usageTotalLimit}
                                    oncePerCustomer={usageOncePerCustomer}
                                />
                            )}
                            <CombinationCard
                                combinableDiscountTypes={combinesWith}
                                discountClass={DiscountClass.Order}
                                discountDescriptor={
                                    discountMethod.value === DiscountMethod.Automatic
                                        ? discountTitle.value
                                        : discountCode.value
                                }
                            />
                            <ActiveDatesCard
                                startDate={startDate}
                                endDate={endDate}
                                timezoneAbbreviation="EST"
                            />
                        </form>
                    </Layout.Section>
                    <Layout.Section secondary>
                        <SummaryCard
                            header={{
                                discountMethod: discountMethod.value,
                                discountDescriptor:
                                    discountMethod.value === DiscountMethod.Automatic
                                        ? discountTitle.value
                                        : discountCode.value,
                                appDiscountType: "Order",
                                isEditing: false,
                            }}
                            performance={{
                                status: DiscountStatus.Scheduled,
                                usageCount: 0,
                            }}
                            minimumRequirements={{
                                requirementType: requirementType.value,
                                subtotal: requirementSubtotal.value,
                                quantity: requirementQuantity.value,
                                currencyCode: currencyCode,
                            }}
                            usageLimits={{
                                oncePerCustomer: usageOncePerCustomer.value,
                                totalUsageLimit: usageTotalLimit.value,
                            }}
                            activeDates={{
                                startDate: startDate.value,
                                endDate: endDate.value,
                            }}
                        />
                    </Layout.Section>
                    <Layout.Section>
                        <PageActions
                            primaryAction={{
                                content: "Save discount",
                                onAction: submit,
                                disabled: !dirty,
                                loading: submitting,
                            }}
                            secondaryActions={[
                                {
                                    content: "Discard",
                                    onAction: () => onBreadcrumbAction(redirect, true),
                                },
                            ]}
                        />
                    </Layout.Section>
                </Layout>
            </Page>
        );
    }
