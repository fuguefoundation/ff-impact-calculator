import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Grid from '@material-ui/core/Grid'
import Container from '@material-ui/core/Container'
import Divider from '@material-ui/core/Divider'
import { withRouter } from 'react-router-dom'
import qs from 'qs'
import Typography from '@material-ui/core/Typography'
import Link from '@material-ui/core/Link'
import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import Input from '@material-ui/core/Input'
import InputAdornment from '@material-ui/core/InputAdornment'
import FormHelperText from '@material-ui/core/FormHelperText'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import Button from '@material-ui/core/Button'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
//import AssessmentIcon from '@material-ui/icons/Assessment'
import SvgIcon from '@material-ui/core/SvgIcon'
import Slider from '@material-ui/core/Slider'
import { FormattedNumber } from 'react-intl'
import BigNumber from 'bignumber.js'
import ChartistGraph from 'react-chartist'
import { withStyles } from '@material-ui/core/styles'

import COUNTRIES from 'lib/calculate/data/countries.json'
import COINS from 'lib/calculate/data/coins.json'
import { calculate, getCurrencyCode, getCryptoExchange, getDonationComparisonAmount } from 'lib/calculate/index_crypto'
import { COMPARISONS, MEDIAN_INCOME } from '../../lib/calculate/index_crypto'

// import { Page } from 'components/Contentful'

// import Dialog from '@material-ui/core/Dialog'
// import DialogTitle from '@material-ui/core/DialogTitle'
// import DialogContent from '@material-ui/core/DialogContent'
// import IconButton from '@material-ui/core/IconButton'
// import CloseIcon from '@material-ui/icons/Close'
// standalone
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'

const MAX_HOUSEHOLD_NUMBER = 10
const GRID_SPACING = 4

const SpacedDivider = withStyles(theme => ({
  root: {
    marginTop: theme.spacing(GRID_SPACING),
    marginBottom: theme.spacing(GRID_SPACING)
  }
}))(Divider)

const CenteredInput = withStyles({
  input: {
    textAlign: 'center'
  }
})(Input)

export const getCountryName = countryCode => {
  const country = COUNTRIES.filter(c => c.code === countryCode)[0]
  return country ? country.name : null
}

export const parseNumericInput = input => {
  if (input === '') return ''
  const val = BigNumber(input.replace(/,/g, '').replace(/^(\d+)(\.\d{0,2})?.*/g, '$1$2')).toNumber()
  return isNaN(val) ? '' : val
}

export const validCountry = input => COUNTRIES.some(country => country.code === input)
export const validCoin = input => COINS.some(coin => coin.code === input)
export const validDonation = input => typeof input === 'number' && /^\d+(\.\d{0,2})?$/.test(input.toString()) && input > 0
export const validInteger = input => typeof input === 'number' && /^\d+$/.test(input.toString())
export const greaterThanZero = input => typeof input === 'number' && input > 0

const controlsStyles = theme => ({
  root: {
    margin: theme.spacing(GRID_SPACING, 0)
  }
})

const validateSettings = ({ donation, countryCode, coinCode, household }) => [
  validCountry(countryCode),
  validCoin(coinCode),
  validDonation(donation),
  validInteger(household.adults) && greaterThanZero(household.adults),
  validInteger(household.children)
].every(a => a)

const Controls = withStyles(controlsStyles)(({ donation, countryCode, coinCode, household, exchangeRate, onChange, onCalculate, setExchangeRate, classes }) => {
  const [inflightParsing, setInflightParsing] = useState(0);

  const getExchangeRate = async (coinCode) => {
    const rate = await getCryptoExchange(coinCode)
    setExchangeRate(rate)
  }

  // change handlers
  const handleCountryChange = event => onChange({ countryCode: event.target.value })
  const handleCoinChange = event => {
    const coinCode = event.target.value
    onChange({ coinCode })
    getExchangeRate(coinCode)
  }

  const handleIncomeChange = event => {
    clearTimeout(inflightParsing)

    const donationString = event.target.value
    onChange({ donation: donationString })

    const timeoutId = setTimeout(() => {
      const donation = parseNumericInput(donationString)
      onChange({ donation })
    }, 700)
    setInflightParsing(timeoutId)
  }

  const handleHouseholdChange = (event, key) => {
    const val = parseNumericInput(event.target.value)
    if (typeof val === 'number' && val > MAX_HOUSEHOLD_NUMBER) return
    onChange({ household: { ...household, ...{ [key]: val } } })
  }

  const isValid = validateSettings({ donation, countryCode, coinCode, household })

  return <form className={classes.root}>
    <Grid container spacing={GRID_SPACING}>

      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth>
          <InputLabel htmlFor="select-country">Country</InputLabel>
          <Select onChange={handleCountryChange} value={countryCode} inputProps={{
            name: 'country'
          }}>
            {COUNTRIES.map(Country => <MenuItem key={Country.code} value={Country.code}>
              {Country.name}
            </MenuItem>)}
          </Select>
          <FormHelperText>Select your country</FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth>
          <InputLabel htmlFor="select-coin">Cryptocurrency</InputLabel>
          <Select onChange={handleCoinChange} value={coinCode} inputProps={{
            name: 'coin'
          }}>
            {COINS.map(Coin => <MenuItem key={Coin.code} value={Coin.code}>
              {Coin.name}
            </MenuItem>)}
          </Select>
          <FormHelperText>Select your coin</FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth>
          <InputLabel htmlFor='donation'>Donation</InputLabel>
          <CenteredInput
            value={donation}
            id='donation'
            onChange={handleIncomeChange}
            endAdornment={<InputAdornment position='end'>{coinCode}</InputAdornment>}
          />
          <FormHelperText>
            Enter your donation in{' '}
            {coinCode}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
          <span>
            {exchangeRate 
                ? `${coinCode} price: ${exchangeRate} | Donation: ${donation*exchangeRate}` 
                : undefined
            }
          </span>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth>
          <InputLabel htmlFor='household[adults]'>Adults</InputLabel>
          <CenteredInput value={household.adults} onChange={event => handleHouseholdChange(event, 'adults')} />
          <FormHelperText>Enter the number of adults in your household</FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <FormControl fullWidth>
          <InputLabel htmlFor='household[children]'>Children</InputLabel>
          <CenteredInput value={household.children} onChange={event => handleHouseholdChange(event, 'children')} />
          <FormHelperText>Enter the number of children in your household</FormHelperText>
        </FormControl>
      </Grid>

        <Grid item xs={12} sm={8} md={6}>
          <Button fullWidth color='primary' variant='contained' disabled={!isValid} onClick={onCalculate}>Calculate <CheckCircleIcon /></Button>
        </Grid>
    </Grid>

  </form>
})

Controls.propTypes = {
  donation: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  countryCode: PropTypes.string.isRequired,
  coinCode: PropTypes.string.isRequired,
  household: PropTypes.shape({
    adults: PropTypes.number.isRequired,
    children: PropTypes.number
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onCalculate: PropTypes.func.isRequired
}

const pieChartOptions = {
  donut: true
}
const PieChart = ({ data }) => {
  return <ChartistGraph className='ct-minor-seventh' type='Pie' data={data} options={pieChartOptions} />
}

PieChart.propTypes = {
  data: PropTypes.object.isRequired
}

const getIncomeCentileData = ({ incomeCentile, incomeTopPercentile }) => ({
  series: [
    incomeTopPercentile,
    incomeCentile
  ],
  labels: [
    `Your donation is here (${incomeTopPercentile}%)`,
    `Population earning less per month (${incomeCentile}%)`
  ]
})

// divide MEDIAN_INCOME by 12 for monthly stat
const getMedianChartData = ({ equivalizedIncome }) => ({
  labels: ["Median person's monthly income", 'Your donation'],
  series: [
    [MEDIAN_INCOME/12, equivalizedIncome]
  ]
})

const barChartOptions = {
  axisY: {
    onlyInteger: true
  }
}
const BarChart = ({ data }) => {
  return <ChartistGraph className='ct-minor-seventh' type='Bar' data={data} options={barChartOptions} />
}

BarChart.propTypes = {
  data: PropTypes.object.isRequired
}

const calculationStyles = theme => ({
  root: {
    '& em': {
      borderBottom: '1px dashed',
      borderBottomColor: theme.palette.grey[800],
      fontStyle: 'normal'
    }
  },
  mainText: {
    color: theme.palette.primary.main,
    fontSize: '2rem',
    fontWeight: 700
  },
  subMainText: {
    color: theme.palette.primary.main,
    fontSize: '1rem'

  },
  chartText: {
    color: theme.palette.primary.main,
    fontSize: '1.25rem',
    fontWeight: 700
  }
})

const Calculation = withStyles(calculationStyles)(({ donation, countryCode, coinCode, household, exchangeRate, classes }) => {
  try {
    const { incomeCentile, incomeTopPercentile, medianMultiple, equivalizedIncome } = calculate({ donation, countryCode, exchangeRate, household })
    if (incomeCentile <= 50) {
      return <Grid container spacing={GRID_SPACING}>
        <Grid item xs={12}>
          <Typography paragraph>
            Sorry, the donation you entered is below the global median income.{' '}
            We only have data for incomes higher than the global median.
          </Typography>
        </Grid>
      </Grid>
    }
    const incomeCentileData = getIncomeCentileData({ incomeCentile, incomeTopPercentile })

    return <Grid container spacing={4} justify='center' className={classes.root}>
      <Grid item xs={12}>
        <Typography className={classes.mainText}>
          If you make a donation of{' '}
          <FormattedNumber value={donation} style='currency' currency={coinCode} minimumFractionDigits={0} maximumFractionDigits={2} />
        </Typography>
        <Typography className={classes.subMainText}>
          (in a household of {household.adults} adult{household.adults > 1 ? 's' : ''}
          {household.children > 0 && <span>
            {' '}and {household.children} child{household.children > 1 ? 'ren' : ''}
          </span>}
          )
        </Typography>
      </Grid>
      <Grid item sm={6}>
        <PieChart data={incomeCentileData} />
        <Typography className={classes.chartText}><em>{100 - incomeTopPercentile}%</em> of the global population earns less income per month than your donation</Typography>
      </Grid>
      <Grid item sm={6}>
        <BarChart data={getMedianChartData({ equivalizedIncome })} />
        <Typography className={classes.chartText}>Your donation is more than <em>{medianMultiple}</em> times the global monthly median</Typography>
        <Typography variant='caption'>
          Income shown in household-equivalised{' '}
          <Link href='https://en.wikipedia.org/wiki/International_United_States_dollar' target='_blank' rel='noreferrer'>
            international dollars (I$)
          </Link>
        </Typography>
      </Grid>
    </Grid>
  } catch (err) {
    console.warn(err)
    return <Grid item xs={12}><Typography>
      Sorry, we {"don't"} have data for {getCountryName(countryCode)}
    </Typography></Grid>
  }
})

const formatPercentage = val => `${val}%`

const MAX_DONATION_SLIDER_VALUE = 50
const DONATION_SLIDER_MARKS = [...Array(MAX_DONATION_SLIDER_VALUE).keys()]
  .filter(v => v % 5 === 0)
  .map(v => ({ value: v, label: formatPercentage(v) }))

const DonationCalculation = withStyles(calculationStyles)(({ donation, countryCode, coinCode, household, donationPercentage, onDonationPercentageChange, exchangeRate, classes }) => {
  try {
    const donationIncome = BigNumber(donation * (100 + donationPercentage) / 100).dp(2).toNumber() //add donation percentage, since goal is to encourage user to donate more
    //const donationValue = BigNumber(donation).minus(donationIncome).dp(2).toNumber()
    console.log("Donation Income: ", donationIncome)
    const { incomeCentile, incomeTopPercentile, medianMultiple, equivalizedIncome, convertedIncome } = calculate({ donation: donationIncome, countryCode, exchangeRate, household })
    const donationValue = BigNumber(equivalizedIncome * (100 + donationPercentage) / 100).dp(2).toNumber()
    console.log("Donation Value: ", donationValue)
    if (incomeCentile <= 50) return null
    return <Grid container spacing={GRID_SPACING} justify='center' className={classes.root}>
      <Grid item xs={12}>
        <Typography className={classes.mainText}>
          Donate {donationPercentage}% more...
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Slider
          value={donationPercentage}
          getAriaValueText={formatPercentage}
          step={donationPercentage >= 20 ? 5 : 1}
          min={1}
          max={MAX_DONATION_SLIDER_VALUE}
          marks={DONATION_SLIDER_MARKS}
          onChange={onDonationPercentageChange}
        />
      </Grid>
      <Grid item sm={12}>
        <Typography className={classes.mainText}>
          ...for a total of{' '}
          <FormattedNumber value={donationIncome} style='currency' currency={coinCode} minimumFractionDigits={0} maximumFractionDigits={2} />
          {/** <FormattedNumber value={donationValue} style='currency' currency={getCurrencyCode(countryCode)} minimumFractionDigits={0} maximumFractionDigits={0} /> */}
        </Typography>
      </Grid>
      <Grid item sm={6}>
        <PieChart data={getIncomeCentileData({ incomeCentile, incomeTopPercentile })} />
        <Typography className={classes.chartText}>
          You would be donating more than what <em>{100 - incomeTopPercentile}%</em> of the global population earn in a month
        </Typography>
      </Grid>
      <Grid item sm={6}>
        <BarChart data={getMedianChartData({ equivalizedIncome })} />
        <Typography className={classes.chartText}>
          This donation would be <em>{medianMultiple}</em> times the global monthly median
        </Typography>
      </Grid>
      <Grid item sm={12}>
        <DonationComparisons value={donationValue} />
      </Grid>
    </Grid>
  } catch (err) {
    console.warn(err)
    return null
  }
})

const donationComparisonStyles = theme => ({
  textContainer: {
    '& strong': {
      display: 'inline-block',
      width: '100%',
      fontSize: '2rem'
    }
  },
  comparisonText: {
    fontSize: '1.25rem'
  },
  svgIcon: {
    width: '100%',
    maxWidth: 150,
    height: '100%',
    maxHeight: 150
  }
})
const DONATION_COMPARISON_PLACEHOLDER = '%%'
const DonationComparison = withStyles(donationComparisonStyles)(({ value, comparison, classes }) => {
    console.log(value)
    console.log(comparison)
  const parts = comparison.description.split(DONATION_COMPARISON_PLACEHOLDER)
  const elements = [
    parts[0],
    <strong key='comparison-value'><FormattedNumber value={getDonationComparisonAmount(value, comparison)} /></strong>,
    parts[1]
  ].map((el, i) => <span key={i}>{el}</span>)
  return <Grid spacing={GRID_SPACING} container className={classes.root} alignItems='center'>
    <Grid item xs={6} className={classes.iconContainer}>
      <SvgIcon
        color='primary'
        viewBox={comparison.icon.viewBox || '0 0 1000 1000'}
        width="100%" height="100%"
        preserveAspectRatio="xMidYMid meet"
        className={classes.svgIcon}
      >
        {comparison.icon.paths.map(path => <path d={path} key={path} />)}
      </SvgIcon>
    </Grid>
    <Grid item xs={6} className={classes.textContainer}>
      <Typography color='primary' className={classes.comparisonText}>
        {elements}
      </Typography>
    </Grid>
  </Grid>
})

DonationComparison.propTypes = {
  value: PropTypes.number.isRequired,
  comparison: PropTypes.shape({
    id: PropTypes.string.isRequired,
    cost: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.shape({
      paths: PropTypes.array.isRequired,
      viewBox: PropTypes.string
    }).isRequired
  }).isRequired
}

const donationComparisonsStyles = theme => ({
  mainText: {
    color: theme.palette.primary.main,
    fontSize: '2rem',
    fontWeight: 700
  }
})

const DonationComparisons = withStyles(donationComparisonsStyles)(({ value, classes }) => <Grid container spacing={GRID_SPACING} justify='center'>
  <Grid item xs={12}>
    <Typography className={classes.mainText}>And this one donation could fund...</Typography>
  </Grid>
  {COMPARISONS.map(Comparison => <Grid item xs={12} md={4} key={Comparison.id}>
    <DonationComparison value={value} comparison={Comparison} />
  </Grid>)}
</Grid>)

DonationComparisons.propTypes = {
  value: PropTypes.number.isRequired
}

const headingStyles = theme => ({
  root: {
    margin: theme.spacing(0, 0, GRID_SPACING),
    '& a': {
        color: '#b31121',
        textDecoration: 'none'
    }
  }
})

const Heading = withStyles(headingStyles)(({ classes }) => <header className={classes.root}>
  <Typography variant='h2'>Crypto Donation Impact Calculator</Typography>
  <Typography variant='subtitle1'>Find out how much global impact your crypto donation can have on the world</Typography>
</header>)

/*const Methodology = () => <Page showTitle={false} slug='how-rich-am-i-methodology' />

const methodologyDialogStyles = theme => ({
  root: {
    margin: 0,
    padding: theme.spacing(GRID_SPACING)
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(GRID_SPACING / 2),
    top: theme.spacing(GRID_SPACING / 2),
    color: theme.palette.grey[500]
  }
})

const MethodologyDialog = withStyles(methodologyDialogStyles)(({ open, onClose, classes }) =>
  <Dialog onClose={onClose} open={open} aria-labelledby='methodology-title' className={classes.root}>
    <DialogTitle disableTypography >
      <Typography id='methodology-title' variant='h3'>Methodology</Typography>
      <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent item>
      <Methodology />
    </DialogContent>
  </Dialog>)

MethodologyDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
} **/

const creditsStyles = theme => ({
  root: {
    margin: theme.spacing() * 2,
    '& a': {
        color: '#b31121',
        textDecoration: 'none'
    }
  }
})
const Credits = withStyles(creditsStyles)(({ classes }) => <div className={classes.root}>
  <Typography>
    This project is a <a href="https://github.com/fuguefoundation/ff-impact-calculator" target="_blank">fork</a> of the <em>How Rich Am I Calculator</em> developed by <a href='https://www.givingwhatwecan.org' target="_blank">Giving What We Can</a>, where you see how your annual income (in fiat) compares globally. Giving What We Can is a global community of people pledging to donate more, and donate more effectively. You can learn more here about the <a href="https://github.com/centre-for-effective-altruism/how-rich-am-i#methodology" target="_blank">methodology and data sources</a> that went into the statistics and comparisons above.
  </Typography>
</div>)

Credits.propTypes = {
  classes: PropTypes.object
}

/** const callToActionStyles = theme => ({
  logoBackground: {
    height: 130,
    width: 130,
    backgroundColor: theme.palette.primary.main,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

 const CallToAction = withStyles(callToActionStyles)(({ classes }) => <Grid container spacing={GRID_SPACING} justify='center'>
  <Grid item xs={8}>
    <Grid container spacing={GRID_SPACING}>
      <Grid item xs={12}>
        <div className={classes.logoBackground}>
          <img src='https://d33wubrfki0l68.cloudfront.net/18388e7f00903004ecbc40f3599d4989ca66fce3/f0c79/images/logos/gwwc-logo-transparent-nav.png' />
        </div>
      </Grid>
      <Grid item xs={12}>
        <Typography paragraph>We{"'"}re a global community of people pledging to donate more, and donate more effectively.</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button href='https://www.givingwhatwecan.org' color='secondary' variant='contained' fullWidth>Learn more</Button>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button href='https://www.givingwhatwecan.org/pledge' color='primary' variant='contained' fullWidth>Take the Pledge</Button>
      </Grid>
    </Grid>
  </Grid>
</Grid>) **/

const styles = theme => ({
  container: {
    textAlign: 'center',
    '& .ct-chart-donut, .ct-chart-pie': {
      '& .ct-label': {
        fill: '#FFF',
        color: '#FFF',
        fontSize: '1rem',
        fontWeight: 700,
        stroke: theme.palette.primary.main,
        strokeWidth: 2,
        paintOrder: 'stroke',
        strokeLinejoin: 'round',
        strokeLinecap: 'round'
      }
    },
    '& .ct-bar': {
      strokeWidth: 60
    },
    '& .ct-series-a': {
      '& .ct-slice-donut, .ct-slice-bar': {
        stroke: theme.palette.secondary.main
      },
      '& .ct-slice-pie': {
        fill: theme.palette.secondary.main
      },
      '& .ct-bar': {
        stroke: theme.palette.primary.main
      }
    },
    '& .ct-series-b': {
      '& .ct-slice-donut, .ct-slice-bar': {
        stroke: theme.palette.primary.main
      },
      '& .ct-slice-pie': {
        fill: theme.palette.primary.main
      },
      '& .ct-bar': {
        stroke: theme.palette.primary.main
      }
    }
  }
})

class _CryptoRichAmI extends React.PureComponent {
  constructor (props) {
    super(props)
    const qsSettings = this.getSettingsFromQueryString(props)
    const settings = {
      donation: '',
      countryCode: 'USA',
      coinCode: '',
      household: {
        adults: 1,
        children: 0
      },
      ...qsSettings
    }

    this.state = {
      ...settings,
      exchangeRate: 0,
      donationPercentage: 10,
      showCalculations: validateSettings({ ...settings }),
      showMethodologyDialog: false
    }

    // ensure that query string is accurate (e.g. if using legacy query vars)
    if (validateSettings(settings)) this.updateQueryString('replace')
  }

  getSettingsFromQueryString = props => {
    const { location } = props
    const settings = {}
    if (location.search) {
      const { donation, countryCode, household, country, adults, children } = qs.parse(location.search.replace(/^\?/, ''))
      if (donation) settings.donation = parseNumericInput(donation)
      if (countryCode) settings.countryCode = countryCode
      if (household) {
        settings.household = {}
        if (household.adults) settings.household.adults = parseInt(household.adults, 10)
        if (household.children) settings.household.children = parseInt(household.children, 10)
      }
      // legacy keys from GWWC website just in case
      if (!countryCode && country) settings.countryCode = country
      if (!household && (adults || children)) {
        settings.household = {}
        if (adults) settings.household.adults = parseInt(adults, 10)
        if (children) settings.household.children = parseInt(children, 10)
      }
    }
    return settings
  }

  updateQueryString = (method = 'push') => {
    const { history, location } = this.props
    const { donation, countryCode, household } = this.state
    console.log('updating query string', method)
    history[method]({
      pathname: location.pathname,
      search: `?${qs.stringify({ donation, countryCode, household })}`
    })
  }

  handleCalculate = () => {
    console.log(this.state)
    if (!validateSettings({ ...this.state })) return
    this.updateQueryString()
    this.setShowCalculations(true)
  }

  handleControlsChange = newState => {
    this.setShowCalculations(false)
    this.setState({ ...newState })
  }

  handleDonationPercentageChange = async (event, donationPercentage) => {
    await this.setState({ donationPercentage })
  }

  setShowCalculations = showCalculations => this.setState({ showCalculations })

  setShowMethodologyDialog = showMethodologyDialog => this.setState({ showMethodologyDialog })

  setExchangeRate = exchangeRate => this.setState({ exchangeRate })

  componentDidUpdate (prevProps) {
    // update our state if we hit the back button
    if (this.props.location.search !== prevProps.location.search) {
      const settings = this.getSettingsFromQueryString(this.props)
      this.setState(settings)
    }
  }

  render = () => {
    const { showCalculations, showMethodologyDialog } = this.state
    const { classes, standalone } = this.props
    return <div className={classes.container}>
      <Heading />
      <SpacedDivider variant='middle' />
      <Controls {...this.state} onChange={this.handleControlsChange} onCalculate={this.handleCalculate} setExchangeRate={this.setExchangeRate}/>
      {showCalculations && <React.Fragment>
        <SpacedDivider variant='middle' />
        <Calculation {...this.state} />
        <DonationCalculation {...this.state} onDonationPercentageChange={this.handleDonationPercentageChange} />
        <SpacedDivider variant='middle' />
        {/**<CallToAction /> 
        <SpacedDivider variant='middle' />
        {standalone && <Button variant='contained' onClick={() => this.setShowMethodologyDialog(true)}>
          Methodology and Data Sources <AssessmentIcon />
        </Button>} */}
      </React.Fragment>}
      {standalone && <Credits />}
      {/** <MethodologyDialog open={showMethodologyDialog} onClose={() => this.setShowMethodologyDialog(false)} /> */}
    </div>
  }
}

_CryptoRichAmI.propTypes = {
  location: PropTypes.shape({
    search: PropTypes.string,
    pathname: PropTypes.string.isRequired
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired
  }).isRequired,
  classes: PropTypes.object.isRequired,
  standalone: PropTypes.bool
}

const CryptoRichAmI = withStyles(styles)(
  withRouter(_CryptoRichAmI)
)

export default CryptoRichAmI

const standaloneStyles = theme => ({
  content: {
    marginTop: theme.spacing() * 12
  },
  logoBackground: {
    marginRight: theme.spacing() * 2
  },
  logo_img: {
    maxHeight: 50
  }
})

export const CryptoRichAmIStandalone = withStyles(standaloneStyles)(({ classes }) => <Container className={classes.root}>
  <AppBar position='fixed'>
    <Toolbar>
      <a href='https://fuguefoundation.org'>
        <div className={classes.logoBackground}>
          <img className={classes.logo_img} src='https://fuguefoundation.org/images/banner-white-800.png' />
        </div>
      </a>
      <Typography variant='h6'></Typography>
    </Toolbar>
  </AppBar>
  <div className={classes.content}>
    <CryptoRichAmI standalone />
  </div>
</Container>)
