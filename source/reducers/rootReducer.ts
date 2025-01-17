import { Action } from 'Actions/actions'
import { defaultTo, omit, without } from 'ramda'
import reduceReducers from 'reduce-reducers'
import { combineReducers, Reducer } from 'redux'
import { SavedSimulation } from 'Selectors/storageSelectors'
import { DottedName } from '../rules/index'
import { objectifsSelector } from '../selectors/simulationSelectors'
import storageRootReducer from './storageReducer'

function explainedVariable(
	state: DottedName | null = null,
	action: Action
): DottedName | null {
	switch (action.type) {
		case 'EXPLAIN_VARIABLE':
			return action.variableName
		case 'STEP_ACTION':
			return null
		default:
			return state
	}
}

type QuestionsKind =
	| "à l'affiche"
	| 'non prioritaires'
	| 'liste'
	| 'liste noire'

export type SimulationConfig = {
	objectifs:
		| Array<DottedName>
		| Array<{ icône: string; nom: string; objectifs: Array<DottedName> }>
	'objectifs cachés': Array<DottedName>
	situation: Simulation['situation']
	bloquant?: Array<DottedName>
	questions?: Partial<Record<QuestionsKind, Array<DottedName>>>
	branches?: Array<{ nom: string; situation: SimulationConfig['situation'] }>
	'unité par défaut': string
}

type Situation = Partial<Record<DottedName, any>>
export type Simulation = {
	config: SimulationConfig
	url: string
	hiddenNotifications: Array<string>
	situation: Situation
	initialSituation: Situation
	targetUnit: string
	foldedSteps: Array<DottedName>
	unfoldedStep?: DottedName | null
	messages: Object
}

function simulation(
	state: Simulation | null = null,
	action: Action
): Simulation | null {
	if (action.type === 'SET_MESSAGE_READ') {
		return {
			...state,
			messages: { ...state.messages, [action.message]: true },
		}
	}
	if (action.type === 'SET_SIMULATION') {
		const { config, url } = action
		const newTargets = config.objectifs
		if (state && state.config && !action.situation === config) {
			return state
		}
		return {
			config,
			url,
			hiddenNotifications: state?.hiddenControls || [],
			situation: action.situation || {},
			targetUnit: config['unité par défaut'] || '€/mois',
			foldedSteps: action.foldedSteps || [],
			unfoldedStep: null,
			persona: action.persona,
			messages: state?.messages || {},
		}
	}
	if (state === null) {
		return state
	}

	switch (action.type) {
		case 'HIDE_NOTIFICATION':
			return {
				...state,
				hiddenNotifications: [...state.hiddenNotifications, action.id],
			}
		case 'RESET_SIMULATION':
			return {
				...state,
				hiddenNotifications: [],
				situation: state.initialSituation,
				foldedSteps: [],
				unfoldedStep: null,
				persona: null,
				messages: {},
			}
		case 'UPDATE_SITUATION': {
			const targets = objectifsSelector({ simulation: state } as RootState)
			const situation = state.situation
			const { fieldName: dottedName, value } = action
			return {
				...state,
				situation:
					value === undefined
						? omit([dottedName], situation)
						: {
								...(targets.includes(dottedName)
									? omit(targets, situation)
									: situation),
								[dottedName]: value,
						  },
			}
		}
		case 'STEP_ACTION': {
			const { name, step } = action
			if (name === 'fold')
				return {
					...state,
					foldedSteps: state.foldedSteps.includes(step)
						? state.foldedSteps
						: [...state.foldedSteps, step],

					unfoldedStep: null,
				}
			if (name === 'unfold') {
				const previousUnfolded = state.unfoldedStep
				return {
					...state,
					foldedSteps: state.foldedSteps,
					unfoldedStep: step,
				}
			}
			return state
		}
		case 'UPDATE_TARGET_UNIT':
			return {
				...state,
				targetUnit: action.targetUnit,
			}
	}
	return state
}
function rules(state = null, { type, rules }) {
	if (type === 'SET_RULES') {
		return rules
	} else return state
}

function tutorials(state = {}, { type, id }) {
	if (type === 'SKIP_TUTORIAL') {
		return { ...state, [id]: 'skip' }
	} else if (type === 'RESET_TUTORIALS') {
		return {}
	} else return state
}

function scenario(state = 'B', action) {
	if (action.type === 'SET_SCENARIO') {
		return action.scenario
	} else return state
}

function batchUpdateSituationReducer(state: RootState, action: Action) {
	if (action.type !== 'BATCH_UPDATE_SITUATION') {
		return state
	}
	return Object.entries(action.situation).reduce<RootState | null>(
		(newState, [fieldName, value]) => {
			const withSituationUpdate = mainReducer(newState ?? undefined, {
				type: 'UPDATE_SITUATION',
				fieldName,
				value,
			})
			return (
				!action.doNotFold &&
				mainReducer(withSituationUpdate ?? undefined, {
					type: 'STEP_ACTION',
					name: 'fold',
					step: fieldName,
				})
			)
		},
		state
	)
}

const mainReducer = (state: any, action: Action) =>
	combineReducers({
		explainedVariable,
		// We need to access the `rules` in the simulation reducer
		simulation: (a: Simulation | null = null, b: Action): Simulation | null =>
			simulation(a, b),
		previousSimulation: defaultTo(null) as Reducer<SavedSimulation | null>,
		rules,
		iframeOptions: defaultTo(null),
		tutorials,
		scenario,
	})(state, action)

export default reduceReducers<RootState>(
	mainReducer as any,
	storageRootReducer as any,
	batchUpdateSituationReducer as Reducer<RootState>
) as Reducer<RootState>

export type RootState = ReturnType<typeof mainReducer>
