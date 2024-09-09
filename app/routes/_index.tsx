import { SignInButton, UserButton } from '@clerk/remix';
import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { api } from 'convex/_generated/api';
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from 'convex/react';
import { useEffect } from 'react';

export const meta: MetaFunction = () => {
	return [
		{ title: 'Made Me Smile' },
		{
			name: 'description',
			content: 'An app to help you build a chain of good memories.',
		},
	];
};

const AddMemoryForm = () => {
	const createMemory = useMutation(api.memories.set);

	useEffect(() => {
		const imageInput = document.getElementById('image') as HTMLInputElement;
		const player = document.getElementById('player') as HTMLVideoElement;
		const canvas = document.getElementById('canvas') as HTMLCanvasElement;
		const context = canvas!.getContext('2d')!;
		const captureButton = document.getElementById(
			'capture',
		) as HTMLButtonElement;

		const constraints = {
			video: true,
		};

		captureButton.addEventListener('click', () => {
			// Draw the video frame to the canvas.
			context.drawImage(player, 0, 0, canvas.width, canvas.height);
			const img = canvas.toDataURL();

			canvas.classList.remove('hidden');
			player.classList.add('hidden');

			imageInput.value = img;
		});

		// Attach the video stream to the video element and autoplay.
		navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
			player.srcObject = stream;
		});
	});

	return (
		<>
			<div className="selfie">
				{/* eslint-disable-next-line jsx-a11y/media-has-caption */}
				<video id="player" controls autoPlay width="600" height="400"></video>
				<canvas
					id="canvas"
					className="hidden"
					width="600"
					height="400"
				></canvas>

				<button id="capture">Capture</button>
			</div>

			<form
				onSubmit={(event) => {
					event.preventDefault();

					const data = new FormData(event.target as HTMLFormElement);
					const imageData = data.get('image') as string;
					const memory = data.get('memory') as string;

					createMemory({
						imageData,
						memory,
					});
				}}
			>
				<input type="hidden" name="image" id="image" />

				<label htmlFor="memory">
					What made you smile?
					<textarea name="memory" id="memory"></textarea>
				</label>

				<button type="submit">Save</button>
			</form>
		</>
	);
};

export default function Index() {
	const memories = useQuery(api.memories.getByUser);

	console.log({ memories });

	return (
		<>
			<header>
				<Link to="/" rel="home">
					Made Me Smile
				</Link>

				<Unauthenticated>
					<SignInButton />
				</Unauthenticated>

				<Authenticated>
					<UserButton />
				</Authenticated>
			</header>
			<main>
				<h1>Made Me Smile</h1>

				<Unauthenticated>
					<p>Log in to continue</p>

					<SignInButton />
				</Unauthenticated>

				<Authenticated>
					<AddMemoryForm />

					<section>
						{memories?.map((data) => {
							return (
								<div className="memory" key={data._id}>
									<img src={data.imageUrl} alt="user uploaded" />
									<p>{data.memory}</p>
								</div>
							);
						})}
					</section>
				</Authenticated>
			</main>
		</>
	);
}
