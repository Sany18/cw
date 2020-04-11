import React from 'react'
import AsyncSelect from 'react-select/async'
import { getDistance } from 'geolib'

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
    selectedCarTypes: {}
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

  handleChangeField = name => value => {
    this.setState({ [name]: value }, this.calculateDistance)
  }

  calculateDistance = () => {
    const { from, whereTo } = this.state

    if (from && whereTo) {
      this.setState({ distance: getDistance(
        { latitude: from.lat, longitude: from.lng },
        { latitude: whereTo.lat, longitude: whereTo.lng }
      ) / 1000 })
    }
  }

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
    const { distance, selectedCarTypes } = this.state
    console.log(selectedCarTypes)

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
                  defaultValue={defaultCities[0]}
                  defaultOptions={defaultCities}
                  onChange={this.handleChangeField('from')} />
              <AsyncSelect placeholder='Where to' loadOptions={this.handleChangeCity}
                  defaultValue={defaultCities[2]}
                  defaultOptions={defaultCities}
                  onChange={this.handleChangeField('whereTo')} />
            </div>
            <div className='cargo'>
              <input type='text' placeholder='Name' required />
              <input type='text' placeholder='Weight' required />
            </div>
            <input type='text' placeholder='Comment' />
          </div>
        </div>

        <div className='right-part part'>
          <div className='choose-location__label'>Results</div>
          <div className='result__distance input'>
            {distance ? distance + ' km' : 'Choose destinations'}
          </div>
        </div>
        <div className='powered-by'>Vlad Nikolskiy</div>
      </div>
    )
  }
}

export default App
