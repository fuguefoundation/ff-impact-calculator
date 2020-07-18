# Crypto Donation Impact Calculator

[Working prototype](https://fuguefoundation.org/dev/impact/)

This project is an effort to incorporate impact metrics into the FF smart contract donation platform, providing potential donors a way to see how a given cryptocurrency donation could translate into real world change. Enter the [*How Rich Am I*](https://howrichami.givingwhatwecan.org/) calculator from [Giving What We Can](https://www.givingwhatwecan.org/), of which this repo is a [fork](https://github.com/centre-for-effective-altruism/how-rich-am-i) ([PR submitted](https://github.com/centre-for-effective-altruism/how-rich-am-i/pull/6)). There are of course a few tweeks. In lieu of entering an annual income, this calculator takes a donation denominated in crypto (currently BTC, ETH, and stable coin), and using live price feeds, compares the equalized amount (accounting for country of origin and size of household) with global incomes on a monthly, rather than annual, basis. In brief, how much does your crypto donation stack up to what others across the world earn each month?

## Changes to Original Codebase

It took a while to figure out first how the app worked and then how to add in the live crypto exchange rates and change the timeframe of the comparisons. The learning process was part code, part macro-economics. We think we got it right, but please post an issue if you have helpful feedback. These are the [data and methodology](https://github.com/centre-for-effective-altruism/how-rich-am-i#methodology) upon which the original calculator is based. Noted below are a few key examples of our modifications, bearing in mind that the goal is to compare a single donation denominated in crypto against the *monthly* global income denominated in equalized, international dollars.

1. The added files include the `CryptoRichAmI` component, the modified `index_crypto.js` in the `calculate` library, the corresponding test files, and one JSON file of data. The component is added into the routing in `App.js`.
2. Calculation modifications include:

`/lib/calculate/index_crypto.js`
``` javascript
// multiply `amount` by 12 to make monthly comparisons
export const interpolateIncomeCentileByAmount = amount => BigNumber(interpolateIncomeCentile({ y: amount*12 }))
    .decimalPlaces(1)
    .toNumber()

// PPP conversion - returns an amount in Internationalized Dollar$
export const internationalizeIncome = (donation, countryCode) => BigNumber(donation)
  .multipliedBy(EXCHANGE_RATES[countryCode].rate) // first convert cryptoUSD price to local currency,
  .dividedBy(PPP_CONVERSION[countryCode].factor) // then determine purchasing price parity
  .decimalPlaces(2)
  .toNumber()

// calculate how many times the monthly median income a person's donation is
export const getMedianMultiple = donation => BigNumber(donation)
  .dividedBy(MEDIAN_INCOME/12) //divide by 12 for monthly rate
  .decimalPlaces(1)
  .toNumber()
```

`components/CryptoRichAmI/index.js`
``` javascript
// divide MEDIAN_INCOME by 12 for monthly stat
const getMedianChartData = ({ equivalizedIncome }) => ({
  labels: ["Median person's monthly income", 'Your donation'],
  series: [
    [MEDIAN_INCOME/12, equivalizedIncome]
  ]
})

//Slider: add donation percentage, rather than subtract it. The goal here is to encourage user to donate more
const donationIncome = BigNumber(donation * (100 + donationPercentage) / 100).dp(2).toNumber() 
```

## API: Crypto Exchange rates

`index_crypto.js` makes an API call on page load to the Kraken API to get the current market price of BTC, ETH, and USDC. As of time of writing, Kraken does not require an API key for this type of `get` request. And because crypto is significantly more divisble than sovereign currency, we have enabled up to 2 decimal points to be entered as the donation. When the user clicks `Calculate`, the amount of their crypto donation (denominated in USD) is converted to their local currency before being internationalized and equivalized through the makeup of their household and their purchasing power parity (as is done in the original calculator).

```
Example GET: https://api.kraken.com/0/public/Ticker?pair=XBTUSD
```

## Troubleshooting

If you encounter an error on `npm install` with `simple-interpolation`, you may consult with [this PR](https://github.com/dmytropaduchak/simple-interpolation/pull/4). `simple-interpolation` uses `npx tsc` as its build script, and if you do not have a global installation of TypeScript, then `npx tsc` would refer to an old version of the TypeScript compiler (1.5.3) since the `tsc` npm package is deprecated. In the meantime, the workaround here is to globally install the latest typescript compiler by running `npm install -g typescript`.