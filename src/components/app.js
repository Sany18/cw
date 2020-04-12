import React from 'react'
import AsyncSelect from 'react-select/async'
import { getDistance } from 'geolib'
import { withAlert } from 'react-alert'

import cities from 'data/cities.json'
import carLocations from 'data/carLocations.json'
import carTypes from 'data/carTypes.json'
import './app.css'

for (let i = 0; i < cities.length; i++) {
  cities[i]['label'] = cities[i]['city']
  cities[i]['value'] = cities[i]['id'] + ''
  delete cities[i]['city']
  delete cities[i]['id']
}

const defaultCities = ((selectedCities = []) => {
  for (let i = 0; i < 25; i++) { selectedCities.push(cities[i]) }

  return selectedCities
})()

const amountOfAvailableCars = ((amount = {}) => {
  carLocations.forEach(car => {
    amount[car.name] ? amount[car.name] += 1 : amount[car.name] = 1
  })

  return amount
})()

class App extends React.Component {
  state = {
    from: null,
    whereTo: null,
    distance: null,
    selectedCarTypes: {},
    selectedWeight: 0,
    name: '',
    comment: '',
    nearestCars: []
  }

  findCities = query => {
    if (query.length < 3) return

    const limit = 25
    let selectedCities = []
    let regExp = new RegExp(query, 'i')

    for (let i = 0; i < cities.length; i++) {
      if (regExp.test(cities[i].label)) selectedCities.push(cities[i])
      if (selectedCities >= limit) break
    }
    
    return selectedCities
  }

  handleChangeCity = (query, callback) => (
    setTimeout(_ => callback(this.findCities(query)), 0)
  )

  handleChangeAsyncSelect = name => value => {
    this.setState({ [name]: value })
  }

  handleChange = name => ({ target: { value } }) => {
    this.setState({ [name]: value })
  }

  calculate = () => {
    const { alert } = this.props
    const { from, whereTo, selectedWeight, selectedCarTypes } = this.state
    const newState = {}
    const nearestCars = []

    if (!from || !whereTo) return alert.show('Choose locations')
    if (!selectedWeight) return alert.show('Enter the weight')

    newState.distance = getDistance(
      { latitude: from.lat, longitude: from.lng },
      { latitude: whereTo.lat, longitude: whereTo.lng }
    ) / 1000
    
    const localSelectedCarTypes = (() => (
      Object.keys(selectedCarTypes).filter(key => selectedCarTypes[key]).length
        ? carLocations.filter(i => selectedCarTypes[i.name])
        : carLocations
    ))()

    for (let i = 0; i < localSelectedCarTypes.length; i++) {
      if (selectedWeight > carTypes.filter(item => item.name === carLocations[i].name)[0].maxWeight * 1000) continue
      nearestCars.push({
        disanceToCar: getDistance(
          { latitude: from.lat, longitude: from.lng },
          { latitude: localSelectedCarTypes[i].latitude, longitude: localSelectedCarTypes[i].longitude }
        ),
        name: localSelectedCarTypes[i].name,
        costByKm: carTypes.filter(item => item.name === carLocations[i].name)[0].costByKm
      })
    }

    newState.nearestCars = nearestCars.sort((a, b) => a.disanceToCar - b.disanceToCar)

    this.setState(newState)
  }

  renderDetails = () => {
    const { selectedWeight, selectedCarTypes, name, comment } = this.state
    const selectedCars = Object.keys(selectedCarTypes)
      .filter(key => selectedCarTypes[key])
      .join(', ')

    return <div className='other-info input'>
      {'car types: ' + (selectedCars ? 'only: ' + selectedCars : 'all types')}<br />
      {'name: ' + name}<br />
      {'weight: ' + selectedWeight + 'kg'}<br />
      {'comment: ' + comment}<br />
    </div>
  }

  renderNearestCars = () => (
    <div className='other-info input'>
      {this.state.nearestCars.map((item, ind) => (
        ind < 5
          ? <div key={'car' + ind} className='other-info__car'>
            <span>{ind + 1 + '. ' + item.name}</span>
            <span>{'to car: ' + (item.disanceToCar / 1000) + 'km'}</span>
            <span>{'cost by km: ' + (item.costByKm / 10) + '$'}</span>
            <span>{'total cost: ' + (item.costByKm / 10 * this.state.distance).toFixed(2) + '$'}</span><br />
          </div>
          : null
      ))}
    </div>
  )

  renderCars = (carItems = []) => {
    const { selectedCarTypes } = this.state
    const images = require.context('assets/images')
    const imagePath = name => images(name)
    const handleCheck = ({ target }) => {
      this.setState({ selectedCarTypes: {
        ...selectedCarTypes, [target.name]: !selectedCarTypes[target.name]
      }})
    }

    for (let i = 1; i <= 10; i++) {
      const carName = carTypes[i - 1].name

      carItems.push(
        <div className='car' key={'car' + i}>
          <img src={imagePath('./car' + i +'.svg')} alt='' />
          <div className='car__description'>
            <div className='car__amount'>{carName}</div>
            <div className='car__amount'>{'max weight: ' + carTypes[i - 1].maxWeight + 't'}</div>
            <div className='car__amount'>{'$ per km: ' + carTypes[i - 1].costByKm / 10 + '$'}</div>
            <div className='car__amount'>
              {'Available ' + amountOfAvailableCars[carName] + ' cars'}
            </div>
            <input name={carName} type='checkbox'
              checked={selectedCarTypes[carName] || false}
              onChange={handleCheck} />
          </div>
        </div>
      )
    }

    return carItems
  }

  render() {
    const { distance } = this.state

    return (
      <div className='content'>
        <div className='cars'>
          {this.renderCars()}
        </div>

        <div className='left-part part'>
          <div className='inputs' action='/'>
            <div className='choose-location'>
              <div className='choose-location__label'>For search enter min 3 symbols</div>
              <AsyncSelect placeholder='From' loadOptions={this.handleChangeCity}
                  defaultOptions={defaultCities}
                  onChange={this.handleChangeAsyncSelect('from')} />
              <AsyncSelect placeholder='Where to' loadOptions={this.handleChangeCity}
                  defaultOptions={defaultCities}
                  onChange={this.handleChangeAsyncSelect('whereTo')} />
            </div>
            <div className='cargo'>
              <input type='text' placeholder='Name'
                  onChange={this.handleChange('name')} />
              <input type='number' placeholder='Weight (kg)'
                  onChange={this.handleChange('selectedWeight')}
                  step='0.5'
                  min='0.5'
                  max='10000' />
            </div>
            <input type='text' placeholder='Comment'
                onChange={this.handleChange('comment')} />
          </div>

          <button className='find-a-car-button' onClick={this.calculate}>
            Find a car
          </button>
        </div>

        <div className='right-part part'>
          <div className='choose-location__label'>Details</div>
          {this.renderDetails()}
          <div className='choose-location__label'>Distance between locations</div>
          <div className='result__distance input'>
            {distance ? distance + ' km' : 'Choose destinations'}
          </div>
          <div className='choose-location__label'>Nearest cars</div>
          {this.renderNearestCars()}
        </div>
        <div className='powered-by'>Vlad Nikolskiy</div>
      </div>
    )
  }
}

export default withAlert()(App)
