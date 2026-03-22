Extend an existing diagnostic lab dashboard UI (already includes reports, patients, and branches). Maintain the same design system, spacing, colors, and layout.

Add the following NEW modules:

1. Doctor Management (NEW PAGE)

Table view:

Doctor Name

Phone

Commission %

Total Revenue Generated

Actions (Edit / View)

Add Doctor Form:

Name

Phone

Commission %

Branch selection

2. Doctor-wise Pricing (IMPORTANT)

Inside Doctor Detail page:

Editable table:

Test Name

Default Price

Doctor Price

Discount %

Toggle: "Use custom pricing"

3. Billing + Commission UI (EXTEND REPORT FLOW)

Enhance "Create Report" / "Report Preview":

Add:

Select Doctor dropdown

Auto price update based on doctor

Add Billing Summary Card (right side panel):

Subtotal

Doctor Discount

Final Amount

Doctor Commission (calculated)

Lab Profit

Show real-time calculation

4. Invoice / Bill UI (NEW PAGE or MODAL)

Clean printable invoice design:

Lab logo

Patient details

Doctor name

Test list with price

Discount

Final amount

Payment status badge

Buttons:

Download PDF

Send via WhatsApp

5. Stock Management (NEW PAGE)

Table:

Item Name

Category (Reagent / Kit)

Quantity

Status (In Stock / Low / Out)

Add Stock Form:

Item name

Quantity

Alert threshold

UI Features:

Highlight low stock in yellow

Highlight out-of-stock in red

Top alert banner: "3 items low in stock"

6. WhatsApp Sharing (MODAL COMPONENT)

Button in:

Report page

Invoice page

Modal:

Select recipient (Doctor / Patient)

Phone number

Message preview

Attach PDF toggle

Send button

7. Sub-User Role UI (EXTENSION)

In Users page:

Add Role column:

Admin

Staff

Approver

Permissions toggle:

Can approve reports

Can manage billing

Can manage stock

Design Guidelines:

Keep same UI style as existing dashboard

Use same sidebar and header

Use cards and tables like current Reports page

Maintain color coding (green, yellow, red statuses)

Clean medical SaaS look

Goal: Seamlessly extend existing lab management UI without redesigning core layout.