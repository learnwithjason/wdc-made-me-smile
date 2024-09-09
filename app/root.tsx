import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from '@remix-run/react';
import { rootAuthLoader } from '@clerk/remix/ssr.server';
import { LoaderFunction } from '@remix-run/node';
import { ClerkApp, useAuth } from '@clerk/remix';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { useState } from 'react';

import './global.css';

export const loader: LoaderFunction = (args) =>
	rootAuthLoader(args, () => {
		const CONVEX_URL = process.env['CONVEX_URL']!;
		const CLERK_PUBLISHABLE_KEY = process.env['CLERK_PUBLISHABLE_KEY']!;

		return { ENV: { CONVEX_URL, CLERK_PUBLISHABLE_KEY } };
	});

function App() {
	const { ENV } = useLoaderData<typeof loader>();
	const [convex] = useState(() => new ConvexReactClient(ENV.CONVEX_URL));

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
					<Outlet />
				</ConvexProviderWithClerk>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default ClerkApp(App);
