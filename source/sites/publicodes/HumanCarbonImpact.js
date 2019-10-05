import { mapObjIndexed, toPairs } from 'ramda'
import React from 'react'
import emoji from 'react-easy-emoji'
import { Link } from 'react-router-dom'
import * as chrono from './chrono'
import scenarios from './scenarios.yaml'

let limitPerPeriod = scenario =>
	mapObjIndexed(
		v => v * scenarios[scenario]['crédit carbone par personne'] * 1000,
		{
			...chrono,
			négligeable: 0
		}
	)

let findPeriod = (scenario, nodeValue) =>
	toPairs(limitPerPeriod(scenario)).find(
		([, limit]) => limit <= Math.abs(nodeValue)
	)

let humanCarbonImpactData = (scenario, nodeValue) => {
	let [closestPeriod, closestPeriodValue] = findPeriod(scenario, nodeValue),
		factor = Math.round(nodeValue / closestPeriodValue),
		closestPeriodLabel = closestPeriod.startsWith('demi')
			? closestPeriod.replace('demi', 'demi-')
			: closestPeriod

	return { closestPeriod, closestPeriodValue, closestPeriodLabel, factor }
}

export default ({ scenario, nodeValue, formule, dottedName }) => {
	let { closestPeriodLabel, closestPeriod, factor } = humanCarbonImpactData(
		scenario,
		nodeValue
	)
	return (
		<div
			css={`
				border-radius: 6px;
				background: var(--colour);
				padding: 1em;
				margin: 0 auto;
				color: var(--textColour);
			`}>
			{closestPeriodLabel === 'négligeable' ? (
				<span>Impact négligeable {emoji('😎')}</span>
			) : (
				<>
					<div
						css={`
							font-size: 220%;
							margin-bottom: 0.25rem;
						`}>
						{factor +
							' ' +
							closestPeriodLabel +
							(closestPeriod[closestPeriod.length - 1] !== 's' &&
							Math.abs(factor) > 1
								? 's'
								: '')}
					</div>
					de&nbsp;
					<Link css="color: inherit" to="/scénarios">
						crédit carbone personnel
					</Link>
				</>
			)}

			<div
				css={`
					position: absolute;
					color: #555;
					font-size: 100%;
					font-weight: 600;
					display: inline-block;
					padding: 0rem 1rem;
					text-transform: uppercase;
					border-radius: 1rem;
					font-family: 'Courier';
					-webkit-mask-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/8399/grunge.png');
					-webkit-mask-size: 944px 604px;
					mix-blend-mode: multiply;
					color: #969494;
					border: 0.15rem solid #969494;
					-webkit-mask-position: 13rem 6rem;
					-webkit-transform: rotate(-16deg);
					-ms-transform: rotate(-16deg);
					transform: rotate(-7deg);
					border-radius: 4px;
					top: 11.2em;
					right: -2em;
				`}>
				1ère estimation
			</div>
		</div>
	)
}
