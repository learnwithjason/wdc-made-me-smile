import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SignInButton, UserButton } from '@clerk/remix';
import type { ActionFunctionArgs, MetaFunction } from '@remix-run/node';
import { Form, json, Link, useActionData } from '@remix-run/react';
import { Authenticated, Unauthenticated } from 'convex/react';
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

export const action = async ({ request }: ActionFunctionArgs) => {
	const S3 = new S3Client({
		region: 'auto',
		endpoint: 'https://fly.storage.tigris.dev',
		credentials: {
			accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
			secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
		},
	});

	console.log({
		accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
		secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
	});

	const formData = await request.formData();
	const image = formData.get('image');
	const memory = formData.get('memory');

	const base64Data = image.split(',').at(1);
	const buf = Buffer.from(base64Data, 'base64');

	const upload = new Upload({
		params: {
			Bucket: 'wdc-made-me-smile',
			Key: 'test',
			Body: buf,
		},
		client: S3,
		queueSize: 3,
	});

	upload.on('httpUploadProgress', (progress) => {
		console.log(progress);
	});

	upload.on('httpError', (error) => {
		console.error(error);
	});

	await upload.done();

	const imageUrl = await getSignedUrl(
		S3,
		new GetObjectCommand({
			Bucket: 'wdc-made-me-smile',
			Key: 'test',
		}),
		{ expiresIn: 3600 },
	);

	return json({ imageUrl });
};

const AddMemoryForm = () => {
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
			console.log({ imageInput, img });
			imageInput.value = img;
		});

		// Attach the video stream to the video element and autoplay.
		navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
			player.srcObject = stream;
		});
	});

	return (
		<>
			{/* eslint-disable-next-line jsx-a11y/media-has-caption */}
			<video id="player" controls autoPlay></video>

			<button id="capture">Capture</button>
			<canvas id="canvas" width="320" height="240"></canvas>

			<Form method="POST" reloadDocument>
				<input type="hidden" name="image" id="image" />

				<label htmlFor="memory">
					What made you smile?
					<textarea name="memory" id="memory"></textarea>
				</label>

				<button type="submit">Save</button>
			</Form>
		</>
	);
};

export default function Index() {
	const actionData = useActionData<typeof action>();

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

				{actionData?.imageUrl ? (
					<img src={actionData.imageUrl} alt="test" />
				) : null}

				<Unauthenticated>
					<p>Log in to continue</p>

					<SignInButton />
				</Unauthenticated>

				<Authenticated>
					<AddMemoryForm />
				</Authenticated>
			</main>
		</>
	);
}
