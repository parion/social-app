import React from 'react'
import {Onboard} from '../../../src/view/screens/Onboard'
import {cleanup, render} from '../../../jest/test-utils'

describe('Onboard', () => {
  jest.useFakeTimers()

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders onboard screen', async () => {
    const {findByTestId} = render(<Onboard />)
    const onboardView = await findByTestId('onboardView')

    expect(onboardView).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<Onboard />)
    expect(page).toMatchSnapshot()
  })
})
