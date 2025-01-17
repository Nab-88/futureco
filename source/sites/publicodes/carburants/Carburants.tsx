import RuleInput from 'Components/conversation/RuleInput'
import Engine from 'publicodes'
import { createContext, useContext, useEffect, useState } from 'react'
import Emoji from '../../../components/Emoji'
import StackedBarChart from '../../../components/StackedBarChart'
import TopBar from '../../../components/TopBar'
import Meta from '../../../components/utils/Meta'
import Documentation from '../pages/Documentation'
import fetchBrentPrice from './fetchBrentPrice'
import pays from './pays.yaml'

const req = require.context('./', true, /\.(yaml)$/)
const rules = req.keys().reduce((memo, key) => {
	const jsonRuleSet = req(key).default || {}
	const splitName = key.replace('./', '').split('>.yaml')
	const prefixedRuleSet =
		splitName.length > 1
			? Object.fromEntries(
					Object.entries(jsonRuleSet).map(([k, v]) => [
						k === 'index' ? splitName[0] : splitName[0] + ' . ' + k,
						v,
					])
			  )
			: jsonRuleSet
	return { ...memo, ...prefixedRuleSet }
}, {})

const engine = new Engine(rules)
const SituationContext = createContext({})
export default ({}) => {
	const [situation, setSituation] = useState({})
	return (
		<div className="ui__ container" css={``}>
			<TopBar />
			<SituationContext.Provider value={[situation, setSituation]}>
				<Meta
					title="Comprendre le prix à la pompe"
					description="Comprendre comment le prix de l'essence et du gazole à la pompe est calculé."
				/>
				<Main />

				<div css=" text-align: center; margin-top: 3rem">
					Comprendre le calcul <Emoji e="⬇️" />
				</div>
				<h2>Explications</h2>
				<Documentation
					documentationPath="/carburants"
					engine={engine}
					embedded
				/>
			</SituationContext.Provider>
		</div>
	)
}
const Main = ({}) => (
	<main>
		<p
			css={`
				display: flex;
				align-items: center;
				justify-content: space-evenly;
				img {
					font-size: 400%;
				}
				h1 {
					margin-top: 1rem;
					max-width: 80%;
				}
			`}
		>
			<Emoji e="⛽️" />
			<h1 css="">Prix à la pompe 2022</h1>
		</p>

		<Questions />
	</main>
)

const Questions = ({}) => {
	const questions = ['type']
	const [situation, setSituation] = useContext(SituationContext)
	engine.setSituation(situation) // I don't understand why putting this in a useeffect produces a loop when the input components, due to Input's debounce function I guess.
	const onChange = (dottedName) => (value) => {
			console.log(value, situation, dottedName)
			const newSituation = (situation) => ({
				...situation,
				[dottedName]: value,
			})
			setSituation((situation) => newSituation(situation))
		},
		onSubmit = () => null
	const evaluation = engine.evaluate('prix à la pompe')
	const [brentPrice, setBrentPrice] = useState(null)
	const brentName = 'baril de brent . dollars'
	useEffect(
		() =>
			fetchBrentPrice().then((res) => {
				setBrentPrice(res)

				onChange(brentName)(res[1])
			}),
		[]
	)

	if (!evaluation.nodeValue) return <p>Problème de calcul.</p>

	const min = 0,
		max = 400,
		brentValue =
			situation[brentName] ||
			brentPrice?.[1] ||
			engine.evaluate(brentName).nodeValue

	return (
		<div
			css={`
				display: flex;
				flex-direction: column;
				align-items: center;
				flex-wrap: wrap;
				> div {
					margin-top: 1rem;
				}
			`}
		>
			<div
				css={`
					margin: 1rem 0;
					.step.input {
						max-width: 12rem;
					}
					.step label {
						padding: 0.2rem 0.6rem 0.2rem 0.4rem;
					}
				`}
			>
				{questions.map((dottedName) => {
					const { question, icônes } = engine.getRule(dottedName).rawNode
					return (
						<div
							css={`
								display: flex;
								justify-content: start;
								align-items: center;
								img {
									font-size: 300%;
									margin-right: 1rem;
								}
								@media (max-width: 800px) {
									img {
										font-size: 200%;
										margin-right: 0.4rem;
									}
								}
								p {
									max-width: 20rem;
								}
							`}
						>
							{icônes && <Emoji e={icônes} />}
							<label>
								<p>{question}</p>
								<RuleInput
									{...{
										engine,
										dottedName,
										onChange: onChange(dottedName),
										onSubmit,
										noSuggestions: false,
									}}
								/>
							</label>
						</div>
					)
				})}
			</div>
			<div
				css={`
					border: 2px solid var(--color);
					padding: 0.2rem 0.6rem;
					border-radius: 0.4rem;
					input {
						width: 12rem;
						margin: 0 auto;
					}
					label {
						display: block;
						text-align: center;
					}
				`}
			>
				<label for="slider">
					Faites{' '}
					<strong css="color: var(--lightColor); font-weight: normal">
						varier
					</strong>{' '}
					le baril de Brent en $.
				</label>
				<div
					css={`
						display: flex;
						align-items: center;
						span {
							margin: 0 0.3rem;
						}
						position: relative;
						padding-top: 1.3rem;
					`}
				>
					<span>{min}</span>
					<input
						type="range"
						id="slider"
						name="slider"
						min={min}
						max={max}
						value={brentValue}
						onChange={(e) => onChange(brentName)(e.target.value)}
						step="5"
						css={`
							background: var(--darkerColor);
							appearance: none;
							height: 0.6rem;

							border-radius: 0.2rem;

							::-webkit-slider-thumb {
								-webkit-appearance: none; /* Override default look */
								appearance: none;
								${sliderHandleStyle}
							}

							::-moz-range-thumb {
								${sliderHandleStyle}
								content: ${brentValue}
							}
						`}
					/>
					<span>{max} $</span>
					<span
						css={`
							position: absolute;
							top: 0;
							left: ${(brentValue / max) * 11 + 1}rem;
						`}
					>
						{Math.round(brentValue)} $
					</span>
				</div>
				<p>
					Par défaut : prix du baril{' '}
					{!brentPrice
						? 'en février 2022 '
						: 'le ' +
						  brentPrice[0].toLocaleString('fr-FR', {
								year: 'numeric',
								month: 'long',
								day: 'numeric',
						  })}{' '}
				</p>
			</div>
			<div>
				<div className="ui__ card box">
					<h2 css="margin: .4rem; font-size: 125%">{evaluation.title}</h2>
					<strong css="font-size: 150%">
						{evaluation.nodeValue.toLocaleString('fr-FR', {
							maximumFractionDigits: 2,
						})}{' '}
						€ / litre
					</strong>
				</div>

				<details css="text-align: center; color: grey; display: none">
					<summary>
						<small>Ma situation</small>
					</summary>

					<ul>
						{Object.entries(situation).map(([k, v]) => (
							<li>{`${k} : ${v?.nodeValue || v}`}</li>
						))}
					</ul>
				</details>
			</div>
			<StackedBarChart
				engine={engine}
				data={[
					{
						dottedName: 'taxes',
						title: 'Taxes 🇫🇷',
						color: '#6a89cc',
					},
					{
						dottedName: 'raffinage et distribution',
						title: 'Raffinage et distribution',
						color: '#f8c291',
					},
					{
						dottedName: 'pétrole brut',
						title: 'Pétrole brut',
						color: '#cf6a87',
					},
				]}
			/>
			<CountriesGraph />
		</div>
	)
}

const sliderHandleStyle = `


border: none;
border-radius: 2rem;
  width: 25px; /* Set a specific slider handle width */
  height: 25px; /* Slider handle height */
  background: var(--color); /* Green background */
  cursor: pointer; /* Cursor on hover */
`

const CountriesGraph = ({}) => {
	const max = Math.max(...Object.values(pays))

	return (
		<ul
			css={`
				padding-left: 0;
				margin-top: 1rem;
				width: 95vw;
				max-width: 30rem;
				li {
					display: flex;
					line-height: 1.2rem;
					align-items: center;
				}
			`}
		>
			{Object.entries(pays)
				.sort(([, a], [, b]) => -a + b)
				.map(([nom, valeur]) => (
					<li key={nom}>
						<span
							css={`
								width: 40%;
								text-align: right;
								padding-right: 0.6rem;
							`}
						>
							{nom}
						</span>
						<span
							css={`
								width: ${(valeur / max) * 60}%;
								height: 1.2rem;
								background: #cf6a87;
								border-radius: 0.2rem;
								color: black;
								display: inline;
								line-height: 1.4rem;
								vertical-align: middle;
								font-weight: bold;
								padding-left: 0.2rem;
								font-size: 90%;
							`}
						>
							{valeur.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}%
						</span>
					</li>
				))}
		</ul>
	)
}
