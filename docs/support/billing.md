# Billing and Subscription

## Overview

Theobase costs **$3 USD per church per month**. New Conferences receive a 6-month free trial, and payments are processed securely through Stripe.

## Pricing

| Item                  | Cost                              |
| --------------------- | --------------------------------- |
| Per church, per month | $3.00 USD                         |
| Example: 50 churches  | $150.00/month                     |
| Free trial            | 6 months from Conference creation |
| Grace period          | 7 days after payment failure      |

## Your Trial Period

When your Conference account is created, a 6-month trial begins automatically. During the trial:

- All features are fully available.
- No payment method is required.
- The trial end date is visible on your Billing page.

## Checking Your Subscription Status

1. From the Conference dashboard, navigate to **Admin → Billing**.
2. You'll see your subscription status:
   - **Trialing**: Trial period in progress. Shows days remaining.
   - **Active**: Subscription is paid and active.
   - **Past Due**: Payment was not received. You're in the 7-day grace period.
   - **Read Only**: Grace period expired. Data is viewable and exportable, but no new data can be entered.

## Setting Up Payment

1. From the Billing page, click **Set Up Payment**.
2. You'll be redirected to Stripe's secure checkout page.
3. Enter your payment details (credit card, debit card, or other Stripe-supported method).
4. Once complete, you'll be redirected back to Theobase.

Your subscription status changes to "Active." Stripe will charge you monthly based on your church count.

## How Billing Works

1. On the first day of each month, Theobase counts the number of churches in your Conference.
2. An invoice is generated: `number_of_churches × $3`.
3. Stripe processes the payment automatically.
4. Invoices are available on the Billing page for your records.

## What Happens If Payment Fails

1. **Day 0**: Payment fails. Your status becomes "Past Due."
2. **Day 1-7**: A 7-day grace period begins. The Service is fully functional. You can update your payment method and retry payment.
3. **Day 8**: If payment is still not resolved, your account enters **Read Only** mode. Users can view and export all data, but cannot create, edit, or confirm new records.
4. Once payment is restored, full functionality resumes immediately.

During Read Only mode, the API returns a 402 status code for any write operation with the message: "Subscription payment required. Please update your billing details."

## Viewing Invoices

On the Billing page, scroll to **Invoice History**. Each invoice shows:

- Billing period (month and year).
- Number of churches billed.
- Amount charged.
- Status (Paid / Unpaid / Past Due).

Click any invoice to download a receipt.

## Updating Payment Method

1. From the Billing page, click **Update Payment Method**.
2. You'll be redirected to Stripe's billing portal.
3. Add or change your payment method.
4. Return to Theobase.

## Cancelling Your Subscription

To cancel, contact support@theobase.app. After cancellation:

- Your data is retained for 30 days for export.
- After 30 days, all Conference Data is permanently deleted.

## Tips

- Enter payment details before your trial ends to avoid interruption.
- If your church count changes mid-month, it's reflected in the next month's invoice.
- For questions about a specific charge, check the invoice before contacting support.
