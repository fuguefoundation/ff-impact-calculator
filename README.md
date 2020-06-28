# Crypto Donation Impact Calculator

[Working prototype](https://fuguefoundation.org/dev/impact/)

This project is an effort to incorporate more metrics into the FF smart contract donation platform, basically a way for people to see what the amount of a potential cryptocurrency donation translates into in terms of real world change. Enter the [*How Rich Am I*](https://howrichami.givingwhatwecan.org/) calculator from [Giving What We Can](https://www.givingwhatwecan.org/), of which this repo is a [fork](https://github.com/centre-for-effective-altruism/how-rich-am-i) (PR forthcoming). There are of course a few tweeks. In lieu of entering an annual income, this calculator takes a donation denominated in crypto (currently BTC, ETH, and stable coin) and compares the equalized amount (accounting for country of origin and size of household) with global incomes on a monthly, rather than annual, basis. In others words, how much does your donation stack up to what others earn each month?

## Changes to Original Codebase

It took a while to figure out first how the app worked and then how to add in the appropriate crypto exchange rates and change the timeframe of the comparisons. The learning process was part code, part macro-economics. We think we got it right, but would certainly appreciate a second set of eyes on the math. These are the specifics on the [data and methodology](https://github.com/centre-for-effective-altruism/how-rich-am-i#methodology) of the original calculator, which we use with certain modificaitons. Noted below are a few key examples, bearing in mind that the goal is to compare a single donation denominated in crypto against the *monthly* global income denominated in equalized, international dollars.

1. The added files include the `CryptoRichAmI` component and the additions in the `calculate` library, notably a modified `index_crypto.js` file and the addition of two JSON files for the data. The component is added into the routing in `App.js`.
2. More specifically for the calculation modifications:

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
  .dividedBy(MEDIAN_INCOME/12) //divide for monthly rate
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

//Slider: add donation percentage, rather than subtract it
const donationIncome = BigNumber(donation * (100 + donationPercentage) / 100).dp(2).toNumber() 
```

## Enhancements

The main enhancement to add will be using an API from a crypto exchange to pull in the market prices of a selected cryptocurrency in realtime. Right now, the app is pulling those values from a static object. I'd also like the app to be able to accept decimals (e.g., .01 BTC or 2.25 ETH) for the donation value. I'll submit this as a bounty on Gitcoin.