# Alissa Green · Fine Artist website

Four pages that share one bag and one Stripe checkout:
- `index.html`: Alissa Green Fine Artist (home)
- `gallery.html`: original art for sale
- `multimedia.html`: Alissa Green Multimedia Art (stickers, prints, cards, apparel, goodies)
- `custom.html`: Alissa Green Custom Moments, with a quote-request form
- `about.html`: Meet Alissa: statement, CV, exhibitions, series list and mailing-list signup
- `thanks.html`: shown after a successful payment
It deploys to Netlify the same way as Sasa's Shop.

## Put it online
1. Make a new GitHub repo (e.g. `alissa-green-art`) and upload everything in this folder.
2. In Netlify: **Add new site → Import from GitHub** → pick the repo. Leave the build settings blank and deploy.
3. In Netlify go to **Site configuration → Environment variables** and add:
   - `STRIPE_SECRET_KEY`: the **same Sasa's Shop Stripe secret key** you already use on that site (`sk_live_…`). Copy it from the Sasa's Shop Netlify site's environment variables, or from Stripe → Developers → API keys.
   - `STRIPE_WEBHOOK_SECRET`: from step 4
4. In Stripe go to **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-SITE.netlify.app/api/stripe-webhook`
   - Event: `checkout.session.completed`
   - Copy the **signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`, then redeploy.

With the webhook set up, anything bought on the site is marked **Sold** automatically, so a one-of-one can't sell twice.

## Custom Moments quote requests
The form uses Netlify Forms. After the first deploy, open **Forms** in Netlify and click **Enable form detection**, then redeploy.
Requests (with the attached photo) show up under Forms → `custom-request`, and mailing-list signups under `mailing-list`. Turn on email notifications there so they come to your inbox.

## Redbubble designs
The 19 Redbubble designs are listed on the Multimedia page and paid for through Stripe, not Redbubble.
When one sells, the Stripe payment shows a `fulfill` link to that Redbubble product, so you can order it there and ship it to the customer.
Prices are starting points (stickers $3, holographic $4, magnets $8, poster $20, canvas $62); edit them in `data/art.json`.

## Gallery wall layout
The gallery hangs each piece at its real proportions, sized by its listed dimensions, slightly askew like a salon wall. Big works (24"+) get a caption beside them, and numbered series (Self Portrait, Waiting Through It, Flush It!…) are grouped around one shared caption. Switch the sort menu to a price sort for a plain grid.

## Everyday edits
- **Add, remove or mark sold:** edit `data/art.json`. Each piece has a `title`, `price` and `shipping` (both in cents, so `$120` is `12000`), and `"sold": true/false`.
- **Photos:** every piece from the Art Sale sheet has its photo at `images/art/<id>.jpg` (the `id` is in `data/art.json`). To add or replace one, save the photo under that name.
- **New Work row on the home page:** in `index.html`, set each `id` in `NEW_WORK` to a piece's id. Its title, size and price then fill in automatically.
- **Social links / Custom Moments link:** at the top of `site.js`.

## How checkout works
- Prices and shipping come from `data/art.json` on the server, so they can't be changed in the browser.
- Buying 2 or more pieces automatically applies 15% off.
- Shipping is combined: the whole order is charged the single highest shipping rate in the bag.
- Stripe collects the US shipping address and phone number.
