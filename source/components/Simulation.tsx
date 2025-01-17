import Conversation, {
	ConversationProps,
} from 'Components/conversation/Conversation'
import PageFeedback from 'Components/Feedback/PageFeedback'
import SearchButton from 'Components/SearchButton'
import * as animate from 'Components/ui/animate'
import React from 'react'
import { Trans } from 'react-i18next'
import { useSelector } from 'react-redux'
import { situationSelector } from '../selectors/simulationSelectors'
import AnswerList from './conversation/AnswerList'
import LinkToForm from './Feedback/LinkToForm'
import useSearchParamsSimulationSharing, {
	useParamsFromSituation,
	syncSearchParams,
} from './utils/useSearchParamsSimulationSharing'

type SimulationProps = {
	explanations?: React.ReactNode
	results?: React.ReactNode
	customEndMessages?: ConversationProps['customEndMessages']
	showPeriodSwitch?: boolean
	showLinkToForm?: boolean
	orderByCategories: Array<Object>
}

export default function Simulation({
	explanations,
	results,
	customEndMessages,
	customEnd,
	orderByCategories,
	showLinkToForm,
	showPeriodSwitch,
	noFeedback,
	animation = 'appear',
}: SimulationProps) {
	const Animation = animate[animation]
	//const situation = useSelector(situationSelector)
	//const searchParams = useParamsFromSituation(situation)
	syncSearchParams()
	return (
		<>
			<AnswerList />
			<SearchButton invisibleButton />
			<Animation delay={0.3}>
				{results}
				<Questions
					customEnd={customEnd}
					orderByCategories={orderByCategories}
					customEndMessages={customEndMessages}
				/>
				{!noFeedback && (
					<>
						{showLinkToForm && <LinkToForm />}
						{!showLinkToForm && (
							<PageFeedback
								customMessage={
									<Trans i18nKey="feedback.simulator">
										Êtes-vous satisfait de ce simulateur ?
									</Trans>
								}
								customEventName="rate simulator"
							/>
						)}
					</>
				)}{' '}
				{explanations}
			</Animation>
		</>
	)
}

function Questions({
	customEndMessages,
	customEnd,
	orderByCategories,
}: {
	customEndMessages?: ConversationProps['customEndMessages']
	orderByCategories: Array<Object>
}) {
	return (
		<>
			<div
				css={`
					@media (min-width: 800px) {
						margin-top: 0.6rem;
					}
					border-radius: 0.6rem;
				`}
			>
				<Conversation
					orderByCategories={orderByCategories}
					customEnd={customEnd}
					customEndMessages={customEndMessages}
				/>
			</div>
		</>
	)
}
