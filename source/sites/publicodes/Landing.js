import { React } from 'Components'
import { useState } from 'react'
import ContributionButton from './ContributionButton'
import Search from './Search'
import Suggestions from './Suggestions'

export default () => {
	const [input, setInput] = useState('')
	return (
		<div>
			<h1 css="margin-top: 1rem; font-size: 140%; line-height: 1.2em">
				Découvre l'impact de chaque geste du quotidien !
			</h1>
			<Search {...{ input, setInput }} />
			<Suggestions {...{ input }} />
			<ContributionButton {...{ input }} />
		</div>
	)
}
