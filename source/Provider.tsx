import { ThemeColorsProvider } from 'Components/utils/colors'
import IframeOptionsProvider from 'Components/utils/IframeOptionsProvider'
import { SitePathProvider, SitePaths } from 'Components/utils/SitePathsContext'
import { TrackerProvider } from 'Components/utils/withTracker'
import i18next from 'i18next'
import React, { useEffect, useMemo } from 'react'
import { I18nextProvider } from 'react-i18next'
import { Provider as ReduxProvider } from 'react-redux'
import { BrowserRouter as Router } from 'react-router-dom'
import reducers, { RootState } from 'Reducers/rootReducer'
import { applyMiddleware, compose, createStore, Middleware, Store } from 'redux'
import thunk from 'redux-thunk'
import RulesProvider from './RulesProvider'
import Tracker from './Tracker'
import { inIframe } from './utils'

declare global {
	interface Window {
		__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any
	}
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

if (NODE_ENV === 'production' && 'serviceWorker' in navigator && !inIframe()) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js')
			.then((registration) => {
				// eslint-disable-next-line no-console
				console.log('SW registered: ', registration)
			})
			.catch((registrationError) => {
				// eslint-disable-next-line no-console
				console.log('SW registration failed: ', registrationError)
			})
	})
}

export type ProviderProps = {
	children: React.ReactNode
	sitePaths?: SitePaths
	initialStore?: RootState
	onStoreCreated?: (store: Store) => void
	reduxMiddlewares?: Array<Middleware>
}

export default function Provider({
	reduxMiddlewares,
	initialStore,
	onStoreCreated,
	children,
	sitePaths = {} as SitePaths,
	dataBranch,
	rulesURL,
}: ProviderProps) {
	const storeEnhancer = composeEnhancers(
		applyMiddleware(thunk.withExtraArgument({}), ...(reduxMiddlewares ?? []))
	)

	// Hack: useMemo is used to persist the store across hot reloads.
	const store = useMemo(() => {
		return createStore(reducers, initialStore, storeEnhancer)
	}, [])
	onStoreCreated?.(store)

	const iframeCouleur =
		new URLSearchParams(document?.location.search.substring(1)).get(
			'couleur'
		) ?? undefined

	return (
		// If IE < 11 display nothing
		<ReduxProvider store={store}>
			<ThemeColorsProvider
				color={iframeCouleur && decodeURIComponent(iframeCouleur)}
			>
				<IframeOptionsProvider>
					<SitePathProvider value={sitePaths}>
						<I18nextProvider i18n={i18next}>
							<Router>
								<RulesProvider>
									<>{children}</>
								</RulesProvider>
							</Router>
						</I18nextProvider>
					</SitePathProvider>
				</IframeOptionsProvider>
			</ThemeColorsProvider>
		</ReduxProvider>
	)
}
