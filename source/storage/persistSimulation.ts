import { Action } from 'Actions/actions'
import { RootState } from 'Reducers/rootReducer'
import { Store } from 'redux'
import { SavedSimulation } from 'Selectors/storageSelectors'
import { debounce } from '../utils'
import safeLocalStorage from './safeLocalStorage'
import { deserialize, serialize } from './serializeSimulation'

const VERSION = 3

const LOCAL_STORAGE_KEY = 'futureco::persisted-simulation::v' + VERSION

export function persistSimulation(store: Store<RootState, Action>) {
	const listener = () => {
		const state = store.getState()
		const objectifs = state.simulation?.config?.objectifs
		if (objectifs?.length != 1 || objectifs[0] !== 'bilan') return null
		if (
			!state.simulation?.foldedSteps?.length &&
			state.tutorials &&
			!Object.values(state.tutorials)
		) {
			return
		}
		safeLocalStorage.setItem(LOCAL_STORAGE_KEY, serialize(state))
	}
	store.subscribe(debounce(1000, listener))
}

export function retrievePersistedSimulation(): SavedSimulation {
	const serializedState = safeLocalStorage.getItem(LOCAL_STORAGE_KEY)
	return serializedState ? deserialize(serializedState) : null
}

export function deletePersistedSimulation(): void {
	safeLocalStorage.removeItem(LOCAL_STORAGE_KEY)
}
