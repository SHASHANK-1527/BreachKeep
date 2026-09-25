import React from 'react'

import ArcweaveFortressView from './arcweave/ArcweaveFortressView.jsx'
import ArcweaveStardustCanvas from './arcweave/SnowdriftCanvas.jsx'

import EmberkeepFortressView from './emberkeep/EmberkeepFortressView.jsx'
import EmberdriftCanvas from './emberkeep/EmberdriftCanvas.jsx'

import RimeguardFortressView from './rimeguard/RimeguardFortressView.jsx'
import RimeguardSnowdriftCanvas from './rimeguard/SnowdriftCanvas.jsx'

import VoltgridCityView from './voltgrid/VoltgridCityView.jsx'
import DataStreamCanvas from './voltgrid/DataStreamCanvas.jsx'

import './ThemeStage.css'

export default function ThemeStage({ house, children }) {
  const norm = (house || '').toLowerCase().trim()

  switch (norm) {
    case 'arcweave':
      return (
        <div className="bk-theme-stage-wrapper" data-house="arcweave">
          <ArcweaveStardustCanvas />
          <ArcweaveFortressView>{children}</ArcweaveFortressView>
        </div>
      )
    case 'emberkeep':
      return (
        <div className="bk-theme-stage-wrapper" data-house="emberkeep">
          <EmberdriftCanvas />
          <EmberkeepFortressView>{children}</EmberkeepFortressView>
        </div>
      )
    case 'rimeguard':
      return (
        <div className="bk-theme-stage-wrapper" data-house="rimeguard">
          <RimeguardSnowdriftCanvas />
          <RimeguardFortressView>{children}</RimeguardFortressView>
        </div>
      )
    case 'voltgrid':
      return (
        <div className="bk-theme-stage-wrapper" data-house="voltgrid">
          <DataStreamCanvas />
          <VoltgridCityView>{children}</VoltgridCityView>
        </div>
      )
    default:
      return <div className="bk-theme-stage-wrapper">{children}</div>
  }
}
